
async function checkAPIs() {
    try {
        console.log('--- Manifold ---');
        const mRes = await fetch('https://api.manifold.markets/v0/search-markets?term=politics&sort=liquidity&limit=5');
        const mData = await mRes.json();
        mData.forEach((m: any) => {
            console.log(`ID: ${m.id}`);
            console.log(`Question: ${m.question}`);
            console.log(`Image: ${m.coverImageUrl || m.image || 'N/A'}`);
            console.log('---');
        });

        console.log('\n--- Kalshi ---');
        const kRes = await fetch('https://api.elections.kalshi.com/trade-api/v2/markets?limit=5');
        const kData = await kRes.json();
        const markets = kData.markets || [];
        markets.slice(0, 5).forEach((m: any) => {
            console.log(`Ticker: ${m.ticker}`);
            console.log(`Title: ${m.title}`);
            console.log(`Image: ${m.image_url || m.image || 'N/A'}`);
            console.log('---');
        });

    } catch (e) {
        console.error(e);
    }
}

checkAPIs();
