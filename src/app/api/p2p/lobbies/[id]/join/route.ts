import { NextResponse } from 'next/server';
import { getLobbyById, joinLobby } from '@/lib/db';
import { determineSelector } from '@/lib/p2p/provablyFair';

// POST /api/p2p/lobbies/[id]/join - Join a lobby
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { opponent } = body;

        if (!opponent) {
            return NextResponse.json({ error: 'Missing opponent' }, { status: 400 });
        }

        const lobby = await getLobbyById(id);

        if (!lobby) {
            return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
        }

        if (lobby.status !== 'waiting') {
            return NextResponse.json({ error: 'Lobby already matched' }, { status: 400 });
        }

        if (lobby.creator === opponent) {
            return NextResponse.json({ error: 'Cannot join your own lobby' }, { status: 400 });
        }

        // Determine who picks heads/tails
        const selector = determineSelector(lobby.server_seed, opponent);

        const rowsAffected = await joinLobby(id, opponent, selector);

        // Optimistic locking: if no rows affected, another player joined first
        if (rowsAffected === 0) {
            return NextResponse.json({ error: 'Game already taken. Another player joined first.' }, { status: 409 });
        }

        return NextResponse.json({
            success: true,
            lobby: {
                id,
                creator: lobby.creator,
                opponent,
                betAmount: Number(lobby.bet_amount),
                status: 'choosing',
                selector,
                serverSeedHash: lobby.server_seed_hash,
            },
        });
    } catch (error) {
        console.error('Failed to join lobby:', error);
        return NextResponse.json({ error: 'Failed to join lobby' }, { status: 500 });
    }
}
