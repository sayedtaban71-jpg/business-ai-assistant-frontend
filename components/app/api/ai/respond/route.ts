import { NextRequest, NextResponse } from 'next/server';
// export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// export const revalidate = 0;
import { getCompany, getTileMessages, updateTile, createTileMessage } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const {
      tileId,
      basePrompt,
      userRefinement,
      company,
      contextVersion
    } = await request.json();
    // Validate required fields
    if (!tileId || !basePrompt || !company) {
      return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
      );
    }

    // Fetch company profile
    // const company = await getCompany(company.iId);

    if (!company) {
      return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
      );
    }

    // Get conversation history
    const history = await getTileMessages(tileId);
    const recentHistory = history.slice(-6); // Last 6 messages

    // Update tile status
    await updateTile(tileId, {
      status: 'loading',
      last_run_context_version: contextVersion
    });

    // Ensure OpenAI is configured before attempting to stream
    if (!process.env.OPENAI_API_KEY) {
      await updateTile(tileId, { status: 'error' });
      return NextResponse.json(
          { error: 'Server is not configured: OPENAI_API_KEY is missing' },
          { status: 400 }
      );
    }

    // Generate streaming response
    // let stream: ReadableStream<Uint8Array>;
    let stream: any;
    try {
      const { generateStreamingResponse } = await import('@/lib/ai');
      stream = await generateStreamingResponse(
          company,
          basePrompt,
          recentHistory,
          userRefinement
      );
    } catch (err) {
      await updateTile(tileId, { status: 'error' });
      return NextResponse.json(
          { error: 'Failed to start AI response stream' },
          { status: 502 }
      );
    }

    // Store the user refinement if provided
    if (userRefinement) {
      await createTileMessage({
        tile_id: tileId,
        role: 'user',
        content: userRefinement
      });
    }

    // @ts-ignore
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
        { error: 'Internal server error000' },
        { status: 500 }
    );
  }
}
