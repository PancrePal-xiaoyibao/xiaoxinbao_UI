import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Optional: Use Edge Runtime for lower latency

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://admin.xiaoyibao.com.cn/api/v1/chat/completions';
const API_KEY = process.env.CHAT_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Upstream error: ${response.status} - ${errorText}` }, { status: response.status });
    }

    // Pass the stream directly to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
