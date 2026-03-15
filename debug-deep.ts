
import fs from 'fs';

async function checkDeep() {
    try {
        const data: any = {};

        console.log('Fetching Manifold...');
        const mRes = await fetch('https://api.manifold.markets/v0/search-markets?term=politics&sort=liquidity&limit=1');
        const mData = await mRes.json();
        data.manifold = mData[0];

        console.log('Fetching Kalshi...');
        const kRes = await fetch('https://api.elections.kalshi.com/trade-api/v2/markets?limit=1');
        const kData = await kRes.json();
        data.kalshi = kData.markets ? kData.markets[0] : null;

        fs.writeFileSync('debug_output.json', JSON.stringify(data, null, 2));
        console.log('Written to debug_output.json');

    } catch (e) {
        console.error(e);
    }
}

checkDeep();
