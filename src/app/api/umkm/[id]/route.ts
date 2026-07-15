import { NextResponse } from 'next/server';
import { getUmkmById, getUmkmBySlug } from '@/repositories/umkmRepository';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  const umkm = !isNaN(numericId) ? getUmkmById(numericId) : getUmkmBySlug(id);

  if (!umkm) {
    return NextResponse.json({ error: 'UMKM not found' }, { status: 404 });
  }
  return NextResponse.json({ data: umkm });
}
