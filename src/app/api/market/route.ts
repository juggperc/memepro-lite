import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint'); // ticker or klines
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || '1d';
    const limit = searchParams.get('limit') || '30';

    if (!symbol || !endpoint) {
        return NextResponse.json({ error: 'Missing symbol or endpoint' }, { status: 400 });
    }

    try {
        let url = '';
        if (endpoint === 'ticker') {
            url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
        } else if (endpoint === 'klines') {
            url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        } else if (endpoint === 'fundingRate') {
            // Binance Futures funding rate
            url = `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&limit=1`;
        } else if (endpoint === 'openInterest') {
            // Binance Futures open interest
            url = `https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`;
        } else {
            return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
        }

        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json({ error: 'Binance API error' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
