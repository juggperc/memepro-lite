import { NextResponse } from 'next/server';
import { getLobbies, createLobby, initializeDatabase } from '@/lib/db';
import { generateServerSeed } from '@/lib/p2p/provablyFair';

// GET /api/p2p/lobbies - List active lobbies
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const isDemo = searchParams.get('demo') === 'true';

        await initializeDatabase();
        const lobbies = await getLobbies(isDemo);

        // Transform DB rows to client format
        const formattedLobbies = lobbies.map((row) => ({
            id: row.id,
            creator: row.creator,
            betAmount: Number(row.bet_amount),
            status: row.status,
            opponent: row.opponent,
            isDemo: row.is_demo,
            serverSeedHash: row.server_seed_hash,
            selector: row.selector,
            choice: row.choice,
            result: row.result,
            winner: row.winner,
            createdAt: new Date(row.created_at).getTime(),
        }));

        return NextResponse.json({ lobbies: formattedLobbies });
    } catch (error) {
        console.error('Failed to fetch lobbies:', error);
        return NextResponse.json({ error: 'Failed to fetch lobbies' }, { status: 500 });
    }
}

// POST /api/p2p/lobbies - Create new lobby
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { creator, betAmount, isDemo } = body;

        if (!creator || !betAmount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await initializeDatabase();

        const id = crypto.randomUUID();
        const { seed: serverSeed, hash: serverSeedHash } = generateServerSeed();

        await createLobby(id, creator, betAmount, isDemo, serverSeedHash, serverSeed);

        return NextResponse.json({
            lobby: {
                id,
                creator,
                betAmount,
                status: 'waiting',
                isDemo,
                serverSeedHash,
                createdAt: Date.now(),
            },
        });
    } catch (error) {
        console.error('Failed to create lobby:', error);
        return NextResponse.json({ error: 'Failed to create lobby' }, { status: 500 });
    }
}
