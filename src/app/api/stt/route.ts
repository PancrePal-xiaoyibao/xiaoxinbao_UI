import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ALIBABA_API_KEY = process.env.ALIBABA_API_KEY;
const STT_MODEL = process.env.ALIBABA_STT_MODEL || 'paraformer-v1';

export async function POST(req: NextRequest) {
    if (!ALIBABA_API_KEY) {
        return NextResponse.json({ error: 'Alibaba API Key not configured' }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const audioFile = formData.get('file');

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        // Using Alibaba's OpenAI-compatible endpoint
        const aliFormData = new FormData();
        aliFormData.append('file', audioFile);
        aliFormData.append('model', STT_MODEL);

        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ALIBABA_API_KEY}`,
            },
            body: aliFormData,
        });

        if (!response.ok) {
            const err = await response.text();
            return NextResponse.json({ error: `Alibaba STT Error: ${err}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({ text: data.text });

    } catch (error) {
        console.error('STT Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
