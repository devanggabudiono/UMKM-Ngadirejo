import { NextResponse } from 'next/server';
import { getAllUmkm, searchUmkm, getByCategory, getKategoriList, getUmkmStats } from '@/repositories/umkmRepository';

/**
 * GET /api/umkm
 *
 * Query parameters:
 * - q:        Search term (searches name, description, category, owner)
 * - category: Filter by category name
 * - stats:    If "true", return aggregate stats instead of list
 * - categories: If "true", return list of all categories
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const wantStats = searchParams.get('stats') === 'true';
    const wantCategories = searchParams.get('categories') === 'true';

    // Return stats
    if (wantStats) {
      const stats = await getUmkmStats();
      return NextResponse.json({ data: stats });
    }

    // Return category list
    if (wantCategories) {
      const categories = await getKategoriList();
      return NextResponse.json({ data: categories });
    }

    // Search
    if (query) {
      const results = await searchUmkm(query);
      return NextResponse.json({ data: results, total: results.length });
    }

    // Filter by category
    if (category) {
      const results = await getByCategory(category);
      return NextResponse.json({ data: results, total: results.length });
    }

    // Default: return all
    const umkmList = await getAllUmkm();
    return NextResponse.json({ data: umkmList, total: umkmList.length });
  } catch (error) {
    console.error('[API /api/umkm] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch UMKM data' },
      { status: 500 }
    );
  }
}
