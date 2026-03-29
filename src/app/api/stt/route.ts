import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ALIBABA_API_KEY = process.env.ALIBABA_API_KEY;
const ALIBABA_BASE_URL = process.env.ALIBABA_BASE_URL;
const STT_MODEL = process.env.ALIBABA_STT_MODEL || 'paraformer-v1';

export async function POST(req: NextRequest) {
  if (!ALIBABA_API_KEY || !ALIBABA_BASE_URL) {
    return NextResponse.json(
      { error: '语音服务配置不完整，请联系管理员' },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('file');

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: '未提供音频文件' },
        { status: 400 }
      );
    }

    const aliFormData = new FormData();
    aliFormData.append('file', audioFile);
    aliFormData.append('model', STT_MODEL);

    const response = await fetch(`${ALIBABA_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ALIBABA_API_KEY}`,
      },
      body: aliFormData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('阿里云 STT 错误:', response.status, errText);
      return NextResponse.json(
        { error: '语音识别服务暂时不可用，请稍后重试' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data?.text;

    if (!text) {
      console.error('STT 响应中无文本:', data);
      return NextResponse.json(
        { error: '未能识别到语音内容，请重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error('STT 路由错误:', error);
    return NextResponse.json(
      { error: '语音识别服务内部错误' },
      { status: 500 }
    );
  }
}
