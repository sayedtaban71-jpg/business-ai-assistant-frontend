import { NextRequest, NextResponse } from 'next/server';

type ParsePromptsRequest = {
	bulkText: string;
	maxItems?: number;
};

type ParsedPrompt = { title: string; prompt: string };

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as ParsePromptsRequest;
		const bulkText = (body?.bulkText || '').toString().trim();
		const maxItems = typeof body?.maxItems === 'number' && body.maxItems > 0 ? Math.min(body.maxItems, 100) : 50;

		if (!bulkText) {
			return NextResponse.json({ error: 'bulkText is required' }, { status: 400 });
		}

		const apiKey = process.env.OPENAI_API_KEY;
		const systemPrompt = `You are a precise parser that extracts a list of prompts from arbitrary user text. 
Output only a strict JSON array of objects with keys: title, prompt. 
Do not include any extra keys, comments, or prose. Titles should be short (≤ 8 words). Prompts should be 1-3 sentences. 
If the input contains numbered lines, bullets, or sections like "Title:" and "Prompt:", interpret each as one prompt.`;
		const userPrompt = `Input text:\n\n${bulkText}\n\nTask: Extract up to ${maxItems} {title, prompt} pairs that represent actionable tiles. Keep JSON compact.`;

		if (!apiKey) {
			// Safe fallback: minimal heuristic split to avoid blocking dev when no key is set
			const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
			const simple: ParsedPrompt[] = lines.slice(0, Math.min(maxItems, lines.length)).map((l, i) => ({
				title: `Item ${i + 1}`,
				prompt: l
			}));
			return NextResponse.json({ prompts: simple });
		}

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
				temperature: 0.2
			})
		});

		if (!resp.ok) {
			const text = await resp.text();
			return NextResponse.json({ error: `OpenAI error: ${resp.status} ${text}` }, { status: 502 });
		}

		const data = await resp.json();
		const content: string = data?.choices?.[0]?.message?.content || '[]';

		let parsed: unknown = [];
		try {
			parsed = JSON.parse(content);
			if (!Array.isArray(parsed)) throw new Error('not an array');
		} catch {
			const start = content.indexOf('[');
			const end = content.lastIndexOf(']');
			if (start >= 0 && end > start) {
				try {
					parsed = JSON.parse(content.slice(start, end + 1));
				} catch {
					parsed = [];
				}
			}
		}

		// Sanitize output
		const prompts: ParsedPrompt[] = Array.isArray(parsed)
			? (parsed as any[])
				.map((p) => ({
					title: (p?.title ?? '').toString().trim(),
					prompt: (p?.prompt ?? '').toString().trim()
				}))
				.filter(p => p.title && p.prompt)
				.slice(0, maxItems)
			: [];

		return NextResponse.json({ prompts });
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
	}
}


