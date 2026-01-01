import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ALIBABA_API_KEY = process.env.ALIBABA_API_KEY;

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

        console.log('STT Request - File type:', audioFile.type, 'File size:', audioFile.size);

        // 使用 OpenAI 兼容模式的语音识别端点
        const aliFormData = new FormData();
        aliFormData.append('file', audioFile);
        aliFormData.append('model', 'paraformer-v1');

        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ALIBABA_API_KEY}`,
            },
            body: aliFormData,
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Alibaba STT API Error:', response.status, errText);
            try {
                const errJson = JSON.parse(errText);
                return NextResponse.json({ error: `Alibaba STT Error: ${JSON.stringify(errJson)}` }, { status: response.status });
            } catch {
                return NextResponse.json({ error: `Alibaba STT Error: ${errText}` }, { status: response.status });
            }
        }

        const data = await response.json();
        console.log('Alibaba STT Response:', JSON.stringify(data, null, 2));

        // OpenAI 兼容模式返回格式: { text: "..." }
        const text = data?.text;

        if (!text) {
            console.error('No text in response:', data);
            return NextResponse.json({ error: 'No text in STT response', details: data }, { status: 500 });
        }

        return NextResponse.json({ text });

    } catch (error) {
        console.error('STT Route Error:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
    }
}
