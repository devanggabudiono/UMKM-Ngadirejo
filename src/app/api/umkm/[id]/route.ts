import { NextResponse } from 'next/server';
import { getUmkmById, getUmkmBySlug } from '@/repositories/umkmRepository';

/**
 * GET /api/umkm/:id
 *
 * Accepts either a numeric ID or a string slug.
 * Returns full UMKM detail including gallery, products, tags, etc.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try numeric ID first, then slug
    const numericId = parseInt(id, 10);
    const umkm = !isNaN(numericId)
      ? await getUmkmById(numericId)
      : await getUmkmBySlug(id);

    if (!umkm) {
      return NextResponse.json(
        { error: 'UMKM not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: umkm });
  } catch (error) {
    console.error('[API /api/umkm/:id] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch UMKM detail' },
      { status: 500 }
    );
  }
}
