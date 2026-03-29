import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ALIBABA_API_KEY = process.env.ALIBABA_API_KEY;
const ALIBABA_BASE_URL = process.env.ALIBABA_BASE_URL;
const TTS_MODEL = process.env.ALIBABA_TTS_MODEL || 'qwen3-tts-flash';
const TTS_VOICE = process.env.ALIBABA_TTS_VOICE || 'loongbella';

/** 清理 Markdown 符号，提取纯文本用于语音合成 */
function cleanMarkdown(text: string): string {
  return text
    .replace(/[#*`_~\[\]()]/g, '')
    .replace(/\d+[.、]/g, '');
}

export async function POST(req: NextRequest) {
  if (!ALIBABA_API_KEY || !ALIBABA_BASE_URL) {
    return NextResponse.json(
      { error: '语音服务配置不完整，请联系管理员' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '未提供有效文本' },
        { status: 400 }
      );
    }

    const cleanText = cleanMarkdown(text);

    const response = await fetch(`${ALIBABA_BASE_URL}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ALIBABA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: cleanText,
        voice: TTS_VOICE,
        response_format: 'mp3',
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('阿里云 TTS 错误:', response.status, errText);
      return NextResponse.json(
        { error: '语音合成服务暂时不可用，请稍后重试' },
        { status: 502 }
      );
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('TTS 路由错误:', error);
    return NextResponse.json(
      { error: '语音合成服务内部错误' },
      { status: 500 }
    );
  }
}
