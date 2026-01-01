import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ALIBABA_API_KEY = process.env.ALIBABA_API_KEY;
const TTS_MODEL = process.env.ALIBABA_TTS_MODEL || 'qwen3-tts-flash';
const TTS_VOICE = process.env.ALIBABA_TTS_VOICE || 'loongbella';

export async function POST(req: NextRequest) {
    if (!ALIBABA_API_KEY) {
        return NextResponse.json({ error: 'Alibaba API Key not configured' }, { status: 500 });
    }

    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        // Clean text: remove markdown symbols
        const cleanText = text.replace(/[#*`_~\[\]()]/g, '').replace(/1\.|2\.|3\.|4\./g, '');

        // Using Alibaba's OpenAI-compatible speech endpoint
        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/audio/speech', {
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
                speed: 1.0
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            return NextResponse.json({ error: `Alibaba TTS Error: ${err}` }, { status: response.status });
        }

        return new Response(response.body, {
            headers: {
                'Content-Type': 'audio/mpeg',
            },
        });

    } catch (error) {
        console.error('TTS Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
