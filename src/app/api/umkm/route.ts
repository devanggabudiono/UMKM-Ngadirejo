import { NextResponse } from 'next/server';
import { getAllUmkm, searchUmkm, getByCategory, getKategoriList, getUmkmStats } from '@/repositories/umkmRepository';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const category = searchParams.get('category');
  const wantStats = searchParams.get('stats') === 'true';
  const wantCategories = searchParams.get('categories') === 'true';

  if (wantStats) return NextResponse.json({ data: getUmkmStats() });
  if (wantCategories) return NextResponse.json({ data: getKategoriList() });
  if (query) { const r = searchUmkm(query); return NextResponse.json({ data: r, total: r.length }); }
  if (category) { const r = getByCategory(category); return NextResponse.json({ data: r, total: r.length }); }

  const all = getAllUmkm();
  return NextResponse.json({ data: all, total: all.length });
}
