import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    const { creator } = body;

    if (!creator) {
        return NextResponse.json({ error: 'Creator wallet required' }, { status: 400 });
    }

    try {
        // Verify lobby exists and belongs to creator
        const result = await sql`
            SELECT * FROM lobbies WHERE id = ${id}
        `;

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
        }

        const lobby = result.rows[0];

        // Check ownership
        if (lobby.creator !== creator) {
            return NextResponse.json({ error: 'Not authorized to cancel this lobby' }, { status: 403 });
        }

        // Only allow cancel if still waiting (no opponent joined)
        if (lobby.status !== 'waiting') {
            return NextResponse.json({ error: 'Cannot cancel - game already started' }, { status: 400 });
        }

        // Delete the lobby
        await sql`DELETE FROM lobbies WHERE id = ${id}`;

        return NextResponse.json({ success: true, message: 'Lobby cancelled' });
    } catch (error) {
        console.error('Cancel lobby error:', error);
        return NextResponse.json({ error: 'Failed to cancel lobby' }, { status: 500 });
    }
}
