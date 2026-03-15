/**
 * Escrow Keypair Generator
 * 
 * Run this script to generate a new escrow wallet keypair.
 * Usage: npx tsx scripts/generate-escrow-keypair.ts
 */

import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

console.log('\n🔐 Generating Escrow Keypair...\n');
console.log('='.repeat(60));

// Generate new keypair
const keypair = Keypair.generate();

// Get public key (for NEXT_PUBLIC_ESCROW_WALLET)
const publicKey = keypair.publicKey.toBase58();

// Get secret key as base64 (for ESCROW_SECRET_KEY)
const secretKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');

// Get secret key as JSON array (for backup)
const secretKeyArray = Array.from(keypair.secretKey);

console.log('\n📋 ENVIRONMENT VARIABLES FOR VERCEL:\n');
console.log('-'.repeat(60));
console.log(`NEXT_PUBLIC_ESCROW_WALLET=${publicKey}`);
console.log('-'.repeat(60));
console.log(`ESCROW_SECRET_KEY=${secretKeyBase64}`);
console.log('-'.repeat(60));
console.log(`NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com`);
console.log(`SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com`);
console.log('-'.repeat(60));

console.log('\n⚠️  IMPORTANT SECURITY NOTES:\n');
console.log('1. NEVER commit the ESCROW_SECRET_KEY to git');
console.log('2. Store these values securely (password manager)');
console.log('3. The escrow wallet needs SOL for transaction fees');
console.log('4. Fund the wallet with enough SOL before going live');

// Save backup to file (gitignored)
const backupPath = path.join(process.cwd(), 'escrow-keypair-backup.json');
fs.writeFileSync(backupPath, JSON.stringify({
    publicKey,
    secretKeyBase64,
    secretKeyArray,
    generatedAt: new Date().toISOString(),
    warning: 'NEVER COMMIT THIS FILE TO GIT'
}, null, 2));

console.log(`\n💾 Backup saved to: ${backupPath}`);
console.log('   (Add this file to .gitignore if not already)\n');

console.log('='.repeat(60));
console.log('\n✅ Next Steps:\n');
console.log('1. Go to https://vercel.com/your-project/settings/environment-variables');
console.log('2. Add each variable above');
console.log('3. Fund the escrow wallet with SOL (at least 0.1 SOL for fees)');
console.log('4. Redeploy your project\n');
