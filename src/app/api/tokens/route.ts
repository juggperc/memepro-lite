import { NextResponse } from 'next/server';

const PUMP_FUN_API = 'https://frontend-api-v3.pump.fun';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'coins';
    const limit = searchParams.get('limit') || '50';
    const sort = searchParams.get('sort') || 'created_timestamp';
    const order = searchParams.get('order') || 'DESC';

    try {
        const url = `${PUMP_FUN_API}/${endpoint}?offset=0&limit=${limit}&sort=${sort}&order=${order}&includeNsfw=false`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
            next: { revalidate: 0 },
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'API error', status: response.status }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API Proxy] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
