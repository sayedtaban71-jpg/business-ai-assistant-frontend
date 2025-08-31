import { NextRequest, NextResponse } from 'next/server';

type GenerateContactsRequest = {
  companyName: string;
  companyUrl?: string;
  count?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateContactsRequest;
    const { companyName, companyUrl, count = 5 } = body || {};

    if (!companyName) {
      return NextResponse.json({ error: 'companyName is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const systemPrompt = `You are a helpful assistant that suggests likely contacts for a company with minimal hallucination. Output strict JSON array with objects using keys: name, title, email, phone, linkedin, notes. Keep values short and plausible. If unknown, omit the field.`;
    const userPrompt = `Company: ${companyName}${companyUrl ? `\nWebsite: ${companyUrl}` : ''}\nGenerate ${count} plausible contacts (decision makers).`;

    // If no API key, return mocked data to avoid breaking the UI in dev
    if (!apiKey) {
      const mock = Array.from({ length: count }).map((_, i) => ({
        name: `Contact ${i + 1} at ${companyName}`,
        title: 'Head of Sales',
        email: `contact${i + 1}@example.com`,
        linkedin: 'https://www.linkedin.com/in/example',
        notes: 'Mock contact (set OPENAI_API_KEY to enable real data)'
      }));
      return NextResponse.json({ contacts: mock });
    }

    // Call OpenAI Chat Completions API
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: `OpenAI error: ${resp.status} ${text}` }, { status: 502 });
    }
    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content || '[]';

    let contacts: unknown = [];
    try {
      contacts = JSON.parse(content);
      if (!Array.isArray(contacts)) throw new Error('not an array');
    } catch {
      // Fallback: attempt to extract JSON array between first [ and last ]
      const start = content.indexOf('[');
      const end = content.lastIndexOf(']');
      if (start >= 0 && end > start) {
        try {
          contacts = JSON.parse(content.slice(start, end + 1));
        } catch {
          contacts = [];
        }
      }
    }

    return NextResponse.json({ contacts });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}


