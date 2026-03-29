import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const API_URL = process.env.CHAT_API_URL;
const API_KEY = process.env.CHAT_API_KEY;

export async function POST(req: NextRequest) {
  if (!API_URL || !API_KEY) {
    return NextResponse.json(
      { error: '服务端配置不完整，请联系管理员' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    // 校验请求体必要字段
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: '请求格式不正确' },
        { status: 400 }
      );
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        messages: body.messages,
        stream: body.stream ?? true,
      }),
    });

    if (!response.ok) {
      console.error('上游 API 错误:', response.status, await response.text());
      return NextResponse.json(
        { error: '对话服务暂时不可用，请稍后重试' },
        { status: 502 }
      );
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('聊天代理错误:', error);
    return NextResponse.json(
      { error: '服务内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}
