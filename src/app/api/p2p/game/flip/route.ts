import { NextResponse } from 'next/server';
import { getLobbyById, setChoice, completeLobby } from '@/lib/db';
import { generateResult } from '@/lib/p2p/provablyFair';
import { requestPayout } from '@/lib/p2p/paymentService';

// Platform fee wallet (server-side only)
const PLATFORM_FEE_WALLET = '5VWeffA29LGHUeKEzgKF9LR3gjGrbT3bc4NEmHXp82N6';
const PLATFORM_FEE_PERCENT = 2;

// POST /api/p2p/game/flip - Execute coinflip
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { lobbyId, choice, clientSeed, player } = body;

        if (!lobbyId || !choice || !clientSeed || !player) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const lobby = await getLobbyById(lobbyId);

        if (!lobby) {
            return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
        }

        if (lobby.status !== 'choosing') {
            return NextResponse.json({ error: 'Game not ready for choice' }, { status: 400 });
        }

        // Verify the correct player is making the choice
        const isCreator = lobby.creator === player;
        const isOpponent = lobby.opponent === player;
        const shouldBeSelector = lobby.selector === 'creator' ? isCreator : isOpponent;

        if (!shouldBeSelector) {
            return NextResponse.json({ error: 'Not your turn to choose' }, { status: 400 });
        }

        // Set the choice and update status
        await setChoice(lobbyId, choice, clientSeed);

        // Generate the result
        const result = generateResult(lobby.server_seed, clientSeed, lobby.nonce || 0);

        // Determine winner
        const selectorWon = result === choice;
        const selectorAddress = lobby.selector === 'creator' ? lobby.creator : lobby.opponent;
        const nonSelectorAddress = lobby.selector === 'creator' ? lobby.opponent : lobby.creator;
        const winner = selectorWon ? selectorAddress : nonSelectorAddress;
        const loser = selectorWon ? nonSelectorAddress : selectorAddress;

        // Calculate payouts
        const totalPot = Number(lobby.bet_amount) * 2;
        const feeAmount = lobby.is_demo ? 0 : Math.floor(totalPot * (PLATFORM_FEE_PERCENT / 100));
        const winnerPayout = totalPot - feeAmount;

        // Complete the lobby in database
        await completeLobby(lobbyId, result, winner);

        // Process actual payout if not demo mode
        let payoutResult = null;
        if (!lobby.is_demo) {
            payoutResult = await requestPayout({
                lobbyId,
                gameType: 'coinflip',
                winnerAddress: winner,
                potLamports: totalPot,
            });

            if (!payoutResult.success) {
                console.error('Payout failed for lobby', lobbyId, payoutResult.error);
                // Game result is still valid, payout can be retried
            }
        }

        return NextResponse.json({
            result,
            winner,
            loser,
            choice,
            potAmount: totalPot,
            feeAmount,
            winnerPayout,
            serverSeed: lobby.server_seed,
            clientSeed,
            nonce: lobby.nonce || 0,
            // Include payout info for non-demo games
            ...(lobby.is_demo ? {} : {
                feeCollected: true,
                payoutProcessed: payoutResult?.success || false,
                payoutSignature: payoutResult?.signature || null,
            }),
        });
    } catch (error) {
        console.error('Failed to execute flip:', error);
        return NextResponse.json({ error: 'Failed to execute flip' }, { status: 500 });
    }
}
