import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tileId = formData.get('tileId') as string;
    const companyId = formData.get('companyId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!tileId) {
      return NextResponse.json(
        { error: 'Tile ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac',
      'video/mp4', 'video/avi', 'video/mov', 'video/quicktime'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only audio and video files are allowed.' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', 'zoom-recordings', tileId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `zoom_recording_${timestamp}.${fileExtension}`;
    const filepath = join(uploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate a mock transcript (in a real implementation, you'd use a speech-to-text service)
    const mockTranscript = `This is a transcript of the Zoom recording: ${file.name}. 
    The recording contains a conversation with the company and provides additional context for AI responses. 
    In a production environment, this would be generated using a speech-to-text service like OpenAI Whisper, 
    Google Speech-to-Text, or Azure Speech Services.`;

    // Return success response
    const response = {
      id: `recording_${timestamp}`,
      name: file.name,
      url: `/uploads/zoom-recordings/${tileId}/${filename}`,
      transcript: mockTranscript,
      tileId,
      companyId,
      uploadedAt: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Zoom recording upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload Zoom recording' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Zoom recording upload endpoint' });
}
