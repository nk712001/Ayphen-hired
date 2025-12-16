import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('[LOGO_UPLOAD] Logo upload request received');

    const data = await request.formData();
    const file: File | null = data.get('logo') as unknown as File;
    const companyId = data.get('companyId') as string;

    console.log('[LOGO_UPLOAD] File info:', {
      hasFile: !!file,
      companyId,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size
    });

    if (!file) {
      console.log('[LOGO_UPLOAD] No file provided');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!companyId) {
      console.log('[LOGO_UPLOAD] No company ID provided');
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      console.log('[LOGO_UPLOAD] Invalid file type:', file.type);
      return NextResponse.json({
        error: `Invalid file type: ${file.type}. Allowed types: JPEG, PNG, GIF, WebP, SVG`
      }, { status: 400 });
    }

    // Validate file size (5MB max for logos)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.log('[LOGO_UPLOAD] File too large:', file.size);
      return NextResponse.json({
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 5MB`
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${companyId}-${Date.now()}.${file.name.split('.').pop()}`;
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'logos');
    const filepath = join(uploadsDir, filename);

    console.log('[LOGO_UPLOAD] Creating directory:', uploadsDir);
    // Create directory if it doesn't exist
    try {
      await mkdir(uploadsDir, { recursive: true });
      console.log('[LOGO_UPLOAD] Directory created/exists');
    } catch (dirError) {
      console.error('[LOGO_UPLOAD] Directory creation error:', dirError);
      // Continue even if directory exists
    }

    console.log('[LOGO_UPLOAD] Saving file:', filepath);
    await writeFile(filepath, new Uint8Array(buffer));
    console.log('[LOGO_UPLOAD] File saved successfully');

    const logoUrl = `/uploads/logos/${filename}`;
    console.log('[LOGO_UPLOAD] Logo URL:', logoUrl);

    return NextResponse.json({ logoUrl });
  } catch (error) {
    console.error('[LOGO_UPLOAD] === CRITICAL ERROR ===');
    console.error('[LOGO_UPLOAD] Error details:', error);
    console.error('[LOGO_UPLOAD] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}