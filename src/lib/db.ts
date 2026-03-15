import { sql } from '@vercel/postgres';

// Initialize lobbies table
export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS lobbies (
      id TEXT PRIMARY KEY,
      creator TEXT NOT NULL,
      bet_amount BIGINT NOT NULL,
      status TEXT DEFAULT 'waiting',
      opponent TEXT,
      is_demo BOOLEAN DEFAULT false,
      server_seed_hash TEXT,
      server_seed TEXT,
      client_seed TEXT,
      nonce INTEGER DEFAULT 0,
      selector TEXT,
      choice TEXT,
      result TEXT,
      winner TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Dice lobbies table
  await sql`
    CREATE TABLE IF NOT EXISTS dice_lobbies (
      id TEXT PRIMARY KEY,
      creator TEXT NOT NULL,
      bet_amount BIGINT NOT NULL,
      target INTEGER NOT NULL,
      is_over BOOLEAN NOT NULL,
      status TEXT DEFAULT 'waiting',
      opponent TEXT,
      is_demo BOOLEAN DEFAULT false,
      server_seed_hash TEXT,
      server_seed TEXT,
      client_seed TEXT,
      nonce INTEGER DEFAULT 0,
      roll_result INTEGER,
      winner TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Payment transactions table for escrow system
  await sql`
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      lobby_id TEXT NOT NULL,
      game_type TEXT NOT NULL,
      type TEXT NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      amount_lamports BIGINT NOT NULL,
      signature TEXT UNIQUE,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Create index for faster lookups
  await sql`
    CREATE INDEX IF NOT EXISTS idx_payment_lobby_id ON payment_transactions(lobby_id)
  `;
}

// Lobby CRUD operations
export async function createLobby(
  id: string,
  creator: string,
  betAmount: number,
  isDemo: boolean,
  serverSeedHash: string,
  serverSeed: string
) {
  await sql`
    INSERT INTO lobbies (id, creator, bet_amount, is_demo, server_seed_hash, server_seed, status)
    VALUES (${id}, ${creator}, ${betAmount}, ${isDemo}, ${serverSeedHash}, ${serverSeed}, 'waiting')
  `;
}

export async function getLobbies(isDemo: boolean) {
  const { rows } = await sql`
    SELECT id, creator, bet_amount, status, opponent, is_demo, 
           server_seed_hash, selector, choice, result, winner, created_at
    FROM lobbies 
    WHERE is_demo = ${isDemo} AND status IN ('waiting', 'matched', 'choosing')
    ORDER BY created_at DESC
    LIMIT 50
  `;
  return rows;
}

export async function getLobbyById(id: string) {
  const { rows } = await sql`
    SELECT * FROM lobbies WHERE id = ${id}
  `;
  return rows[0] || null;
}

export async function joinLobby(id: string, opponent: string, selector: 'creator' | 'opponent'): Promise<number> {
  const result = await sql`
    UPDATE lobbies 
    SET opponent = ${opponent}, status = 'choosing', selector = ${selector}
    WHERE id = ${id} AND status = 'waiting'
  `;
  return result.rowCount || 0;
}

export async function setChoice(id: string, choice: 'heads' | 'tails', clientSeed: string) {
  await sql`
    UPDATE lobbies 
    SET choice = ${choice}, client_seed = ${clientSeed}, status = 'flipping'
    WHERE id = ${id}
  `;
}

export async function completeLobby(
  id: string,
  result: 'heads' | 'tails',
  winner: string
) {
  await sql`
    UPDATE lobbies 
    SET result = ${result}, winner = ${winner}, status = 'completed'
    WHERE id = ${id}
  `;
}

export async function deleteLobby(id: string, creator: string) {
  await sql`
    DELETE FROM lobbies 
    WHERE id = ${id} AND creator = ${creator} AND status = 'waiting'
  `;
}

// Cleanup old lobbies (run periodically)
export async function cleanupOldLobbies() {
  await sql`
    DELETE FROM lobbies 
    WHERE status = 'waiting' AND created_at < NOW() - INTERVAL '1 hour'
  `;
  await sql`
    DELETE FROM dice_lobbies 
    WHERE status = 'waiting' AND created_at < NOW() - INTERVAL '1 hour'
  `;
}

// ============== DICE LOBBY OPERATIONS ==============

export async function createDiceLobby(
  id: string,
  creator: string,
  betAmount: number,
  target: number,
  isOver: boolean,
  isDemo: boolean,
  serverSeedHash: string,
  serverSeed: string
) {
  await sql`
    INSERT INTO dice_lobbies (id, creator, bet_amount, target, is_over, is_demo, server_seed_hash, server_seed, status)
    VALUES (${id}, ${creator}, ${betAmount}, ${target}, ${isOver}, ${isDemo}, ${serverSeedHash}, ${serverSeed}, 'waiting')
  `;
}

export async function getDiceLobbies(isDemo: boolean) {
  const { rows } = await sql`
    SELECT id, creator, bet_amount, target, is_over, status, opponent, is_demo, 
           server_seed_hash, roll_result, winner, created_at
    FROM dice_lobbies 
    WHERE is_demo = ${isDemo} AND status IN ('waiting', 'matched', 'rolling')
    ORDER BY created_at DESC
    LIMIT 50
  `;
  return rows;
}

export async function getDiceLobbyById(id: string) {
  const { rows } = await sql`
    SELECT * FROM dice_lobbies WHERE id = ${id}
  `;
  return rows[0] || null;
}

export async function joinDiceLobby(id: string, opponent: string) {
  await sql`
    UPDATE dice_lobbies 
    SET opponent = ${opponent}, status = 'matched'
    WHERE id = ${id} AND status = 'waiting'
  `;
}

export async function completeDiceLobby(
  id: string,
  rollResult: number,
  winner: string,
  clientSeed: string
) {
  await sql`
    UPDATE dice_lobbies 
    SET roll_result = ${rollResult}, winner = ${winner}, client_seed = ${clientSeed}, status = 'completed'
    WHERE id = ${id}
  `;
}

export async function deleteDiceLobby(id: string, creator: string) {
  await sql`
    DELETE FROM dice_lobbies 
    WHERE id = ${id} AND creator = ${creator} AND status = 'waiting'
  `;
}

