import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sharp from 'sharp';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Process image: resize to max 400px width (retina ready for 200px display), optimize
        const optimizedBuffer = await sharp(buffer)
            .resize(400, null, { // Max width 400px, maintain aspect ratio
                withoutEnlargement: true,
                fit: 'inside'
            })
            .webp({ quality: 80 }) // Compress as WebP
            .toBuffer();

        // Convert to base64 data URI
        const base64Image = `data:image/webp;base64,${optimizedBuffer.toString('base64')}`;

        // Return the data URI directly. Frontend will save this string to the DB.
        return NextResponse.json({ url: base64Image });
    } catch (error) {
        console.error('Upload processing error:', error);
        return NextResponse.json({ error: 'Image processing failed' }, { status: 500 });
    }
}
