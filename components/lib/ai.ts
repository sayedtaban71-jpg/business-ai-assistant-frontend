import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
	throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});


// const SYSTEM_PROMPT = `You are a pragmatic B2B sales assistant. Prioritize clarity, actionable insights, and brevity. When information is missing, ask targeted questions. Keep outputs concise and sales-relevant. Do not fabricate facts about the company.
//
// You will receive structured JSON for company, plus the tile prompt and recent conversation. Ground all responses in those objects. If a switch in context occurs, consider the new company profile authoritative.`;
const SYSTEM_PROMPT = 'You are an expert business research assistant. ' +
	'Cite sources inline where possible. Answer each question briefly' +
	'Please make sure the answer does not include any symbols such as *, #, or `.'
export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export async function generateAIResponse(
	companyProfile: any,
	tilePrompt: string,
	conversationHistory: any[],
	userRefinement?: string
): Promise<string> {
	const messages: ChatMessage[] = [
		{
			role: 'system',
			content: SYSTEM_PROMPT
		},
		{
			role: 'user',
			content: `Please answer the following questions about ${companyProfile['name']}
					Question: ${tilePrompt}`
		}
	];
	// ${conversationHistory.length > 0 ? `Recent Conversation:
	// ${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}` : ''}
	// ${userRefinement ? `User Refinement: ${userRefinement}` : ''}
	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o',
			messages,
			temperature: 0.7,
			max_tokens: 1000,
		});

		return completion.choices[0]?.message?.content || 'No response generated.';
	} catch (error) {
		console.error('OpenAI API error:', error);
		throw new Error('Failed to generate AI response');
	}
}

export async function generateStreamingResponse(
	companyProfile: any,
	tilePrompt: string,
	exAnswer: string,
	lastAnswer: string,
	// conversationHistory: any[],
	userRefinement?: string
// ): Promise<ReadableStream<Uint8Array>> {
): Promise<any> {
	const messages: ChatMessage[] = [
		// {
		// 	role: 'system',
		// 	content: SYSTEM_PROMPT
		// },
		{
			role: 'user',
			content: `I’m an Account Executive at Deel selling global payroll, contractor management, and employer-of-record solutions. 
			I am conducting research into companies as to why they will be a suitable prospect for me to outreach to. 
			Please make sure the answer does not include any symbols such as * and #.
			For ${companyProfile['name']}, I have a  question I require answering based on web source information in the last 12 months (no earlier than Jan 2025).
					Question: ${tilePrompt}.
					${userRefinement == undefined && !exAnswer?'':('Example Answer:'+exAnswer)+'\nPlease print the answer and format exactly the same.'}.
					${lastAnswer&&userRefinement != undefined?('Last Answer:'+lastAnswer+'\nUser Refinement:'+userRefinement):''}.`

		}
	];
	let streamIterator: AsyncIterable<any> | undefined;
	// let streamIterator: any | undefined;
	try {
		streamIterator = await openai.chat.completions.create({
			model: 'gpt-4.1',
			messages,
			temperature: 1,
			stream: true
		});
	} catch (error) {
		console.error('OpenAI API error:', error);
		throw new Error('Failed to start AI response stream');
	}

	// return streamIterator.choices[0].message.content;
	if (!streamIterator) {
		throw new Error('Failed to create stream iterator');
	}

	return new ReadableStream({
		start(controller) {
			(async () => {
				try {
					for await (const chunk of streamIterator!) {
						const content = chunk.choices[0]?.delta?.content;
						if (content) {
							controller.enqueue(new TextEncoder().encode(content));
						}
					}
					controller.close();
				} catch (error) {
					console.error('Stream processing error:', error);
					controller.error(error);
				}
			})();
		},
	});

}