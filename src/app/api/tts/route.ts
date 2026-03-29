import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import {
  cleanTtsText,
  isTrustedOrigin,
  MAX_TTS_TEXT_LENGTH,
  synthesizeSpeech,
  TtsError,
} from '@/lib/server/tts';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const origin = req.headers.get('origin');

  if (!isTrustedOrigin(origin, host)) {
    return NextResponse.json(
      { error: '非法请求来源' },
      { status: 403 }
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

    const cleanText = cleanTtsText(text);

    if (!cleanText) {
      return NextResponse.json(
        { error: '文本内容为空，无法生成语音' },
        { status: 400 }
      );
    }

    if (cleanText.length > MAX_TTS_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `文本过长，请控制在 ${MAX_TTS_TEXT_LENGTH} 个字符以内` },
        { status: 413 }
      );
    }

    const { audio, contentType } = await synthesizeSpeech({
      text: cleanText,
      traceId: randomUUID(),
    });

    return new Response(new Uint8Array(audio), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof TtsError) {
      if (error.logMessage) {
        console.error(error.logMessage);
      } else {
        console.error('TTS 路由错误:', error);
      }

      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error('TTS 路由错误:', error);
    return NextResponse.json(
      { error: '语音合成服务内部错误' },
      { status: 500 }
    );
  }
}
