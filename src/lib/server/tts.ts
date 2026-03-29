import { Buffer } from 'node:buffer';

export const MAX_TTS_TEXT_LENGTH = 2_000;

const TTS_PROVIDER = normalizeProvider(process.env.TTS_PROVIDER);
const TTS_FETCH_TIMEOUT_MS = parsePositiveInt(process.env.TTS_FETCH_TIMEOUT_MS, 45_000);

const ALIBABA_API_KEY = process.env.ALIBABA_API_KEY;
const ALIBABA_BASE_URL = process.env.ALIBABA_BASE_URL;
const ALIBABA_TTS_MODEL = process.env.ALIBABA_TTS_MODEL || 'qwen3-tts-flash';
const ALIBABA_TTS_VOICE = process.env.ALIBABA_TTS_VOICE || 'loongbella';

const DOUBAO_TTS_URL =
  process.env.DOUBAO_TTS_URL || 'https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse';
const DOUBAO_TTS_APP_ID = process.env.DOUBAO_TTS_APP_ID;
const DOUBAO_TTS_ACCESS_KEY = process.env.DOUBAO_TTS_ACCESS_KEY;
const DOUBAO_TTS_RESOURCE_ID = process.env.DOUBAO_TTS_RESOURCE_ID || 'seed-tts-2.0';
const DOUBAO_TTS_SPEAKER = process.env.DOUBAO_TTS_SPEAKER;
const DOUBAO_TTS_MODEL = process.env.DOUBAO_TTS_MODEL;
const DOUBAO_TTS_FORMAT = process.env.DOUBAO_TTS_FORMAT || 'mp3';
const DOUBAO_TTS_SAMPLE_RATE = normalizeSampleRate(process.env.DOUBAO_TTS_SAMPLE_RATE);

const DOUBAO_EVENT_SESSION_FINISHED = 152;
const DOUBAO_EVENT_SESSION_FAILED = 153;
const DOUBAO_EVENT_TTS_SENTENCE_START = 350;
const DOUBAO_EVENT_TTS_SENTENCE_END = 351;
const DOUBAO_EVENT_TTS_RESPONSE = 352;
const DOUBAO_SUCCESS_CODE = 20_000_000;

type TtsProvider = 'alibaba' | 'doubao';

type AudioResult = {
  audio: Buffer;
  contentType: string;
};

type DoubaoSsePayload = {
  audio?: string;
  data?: string;
  event?: number | string;
  message?: string;
  status_code?: number;
  usage?: Record<string, unknown>;
};

type SynthesizeSpeechInput = {
  text: string;
  traceId: string;
};

export class TtsError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly logMessage?: string
  ) {
    super(message);
    this.name = 'TtsError';
  }
}

export function cleanTtsText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#*_~>|]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\d+[.、]/g, '')
    .trim();
}

export function isTrustedOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host) {
    return true;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function synthesizeSpeech(input: SynthesizeSpeechInput): Promise<AudioResult> {
  if (TTS_PROVIDER === 'doubao') {
    return synthesizeWithDoubao(input);
  }

  return synthesizeWithAlibaba(input.text);
}

async function synthesizeWithAlibaba(text: string): Promise<AudioResult> {
  if (!ALIBABA_API_KEY || !ALIBABA_BASE_URL) {
    throw new TtsError(500, '语音服务配置不完整，请联系管理员');
  }

  const response = await fetchWithTimeout(`${ALIBABA_BASE_URL}/audio/speech`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ALIBABA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ALIBABA_TTS_MODEL,
      input: text,
      voice: ALIBABA_TTS_VOICE,
      response_format: 'mp3',
      speed: 1.0,
    }),
  });

  if (!response.ok) {
    const errText = await safeReadText(response);
    throw new TtsError(
      502,
      '语音合成服务暂时不可用，请稍后重试',
      `阿里云 TTS 错误: ${response.status} ${errText}`
    );
  }

  return {
    audio: Buffer.from(await response.arrayBuffer()),
    contentType: 'audio/mpeg',
  };
}

async function synthesizeWithDoubao({ text, traceId }: SynthesizeSpeechInput): Promise<AudioResult> {
  if (!DOUBAO_TTS_APP_ID || !DOUBAO_TTS_ACCESS_KEY || !DOUBAO_TTS_SPEAKER) {
    throw new TtsError(500, '语音服务配置不完整，请联系管理员');
  }

  const response = await fetchWithTimeout(DOUBAO_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-App-Id': DOUBAO_TTS_APP_ID,
      'X-Api-Access-Key': DOUBAO_TTS_ACCESS_KEY,
      'X-Api-Resource-Id': DOUBAO_TTS_RESOURCE_ID,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      user: {
        uid: traceId,
      },
      req_params: {
        text,
        speaker: DOUBAO_TTS_SPEAKER,
        audio_params: {
          format: DOUBAO_TTS_FORMAT,
          sample_rate: DOUBAO_TTS_SAMPLE_RATE,
        },
        additions: {
          disable_markdown_filter: true,
        },
        ...(DOUBAO_TTS_MODEL ? { model: DOUBAO_TTS_MODEL } : {}),
      },
    }),
  });

  const logId = response.headers.get('X-Tt-Logid');

  if (!response.ok) {
    const errText = await safeReadText(response);
    throw new TtsError(
      502,
      '语音合成服务暂时不可用，请稍后重试',
      `豆包 TTS 错误: ${response.status} ${errText}${logId ? ` logid=${logId}` : ''}`
    );
  }

  const audio = await collectDoubaoAudioFromSse(response, logId);

  return {
    audio,
    contentType: resolveAudioContentType(DOUBAO_TTS_FORMAT),
  };
}

async function collectDoubaoAudioFromSse(response: Response, logId: string | null): Promise<Buffer> {
  if (!response.body) {
    throw new TtsError(502, '语音合成服务返回为空，请稍后重试');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: Buffer[] = [];

  let buffer = '';
  let currentEvent = '';
  let currentDataLines: string[] = [];
  let sessionFinished = false;

  const flushEvent = () => {
    if (!currentEvent && currentDataLines.length === 0) {
      return;
    }

    const rawEvent = currentEvent.trim();
    const rawData = currentDataLines.join('\n').trim();

    currentEvent = '';
    currentDataLines = [];

    if (!rawData) {
      return;
    }

    let payload: DoubaoSsePayload;

    try {
      payload = JSON.parse(rawData) as DoubaoSsePayload;
    } catch {
      throw new TtsError(
        502,
        '语音合成服务返回了无法解析的数据',
        `豆包 SSE 非 JSON 数据: ${rawData.slice(0, 200)}${logId ? ` logid=${logId}` : ''}`
      );
    }

    const eventCode = Number(rawEvent || payload.event || 0);

    if (eventCode === DOUBAO_EVENT_TTS_RESPONSE) {
      const audioBase64 = payload.data || payload.audio;
      if (audioBase64) {
        chunks.push(Buffer.from(audioBase64, 'base64'));
      }
      return;
    }

    if (eventCode === DOUBAO_EVENT_TTS_SENTENCE_START || eventCode === DOUBAO_EVENT_TTS_SENTENCE_END) {
      return;
    }

    if (eventCode === DOUBAO_EVENT_SESSION_FINISHED) {
      if (payload.status_code && payload.status_code !== DOUBAO_SUCCESS_CODE) {
        throw new TtsError(
          502,
          '语音合成服务暂时不可用，请稍后重试',
          `豆包 SessionFinished 异常: ${rawData}${logId ? ` logid=${logId}` : ''}`
        );
      }
      sessionFinished = true;
      return;
    }

    if (eventCode === DOUBAO_EVENT_SESSION_FAILED || (payload.status_code && payload.status_code !== DOUBAO_SUCCESS_CODE)) {
      throw new TtsError(
        502,
        '语音合成服务暂时不可用，请稍后重试',
        `豆包会话失败: ${rawData}${logId ? ` logid=${logId}` : ''}`
      );
    }
  };

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      buffer += decoder.decode();
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

      if (line === '') {
        flushEvent();
        continue;
      }

      if (line.startsWith(':')) {
        continue;
      }

      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
        continue;
      }

      if (line.startsWith('data:')) {
        currentDataLines.push(line.slice(5).trimStart());
      }
    }
  }

  if (buffer.trim()) {
    const trailingLines = buffer.split('\n');
    for (const rawLine of trailingLines) {
      const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        currentDataLines.push(line.slice(5).trimStart());
      }
    }
  }

  flushEvent();

  if (!sessionFinished && chunks.length === 0) {
    throw new TtsError(
      502,
      '语音合成服务暂时不可用，请稍后重试',
      `豆包 SSE 在完成前结束${logId ? ` logid=${logId}` : ''}`
    );
  }

  if (chunks.length === 0) {
    throw new TtsError(
      502,
      '未生成可播放的语音，请稍后重试',
      `豆包未返回音频片段${logId ? ` logid=${logId}` : ''}`
    );
  }

  return Buffer.concat(chunks);
}

async function fetchWithTimeout(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TTS_FETCH_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TtsError(504, '语音合成请求超时，请稍后重试');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return '';
  }
}

function normalizeProvider(value: string | undefined): TtsProvider {
  return value?.toLowerCase() === 'doubao' ? 'doubao' : 'alibaba';
}

function normalizeSampleRate(value: string | undefined): number {
  const sampleRate = parsePositiveInt(value, 24_000);
  const allowedRates = new Set([8_000, 16_000, 22_050, 24_000, 32_000, 44_100, 48_000]);
  return allowedRates.has(sampleRate) ? sampleRate : 24_000;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveAudioContentType(format: string): string {
  switch (format) {
    case 'ogg_opus':
      return 'audio/ogg';
    case 'pcm':
      return 'audio/L16';
    case 'mp3':
    default:
      return 'audio/mpeg';
  }
}
