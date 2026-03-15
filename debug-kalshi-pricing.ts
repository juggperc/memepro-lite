
async function debugKalshiPricing() {
    try {
        console.log('Fetching Kalshi...');
        const res = await fetch('https://api.elections.kalshi.com/trade-api/v2/markets?limit=100&status=open');
        const data = await res.json();
        const markets = data.markets || [];

        // Filter for markets that look "active" or interesting but might have bad data
        const samples = markets.slice(0, 5);

        samples.forEach((m: any) => {
            console.log(`Ticker: ${m.ticker}`);
            console.log(`Title: ${m.title}`);
            console.log(`Subtitle: ${m.subtitle}`);
            console.log(`Yes Subtitle: ${m.yes_sub_title}`);
            console.log(`No Subtitle: ${m.no_sub_title}`);
            console.log(`Last Price: ${m.last_price}`);
            console.log(`Yes Bid: ${m.yes_bid}`);
            console.log(`Yes Ask: ${m.yes_ask}`);
            console.log(`No Bid: ${m.no_bid}`);
            console.log(`No Ask: ${m.no_ask}`);
            console.log('--------------------------------');
        });

    } catch (e) {
        console.error(e);
    }
}

debugKalshiPricing();
