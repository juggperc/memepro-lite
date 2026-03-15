
async function debugKalshi() {
    try {
        console.log('Fetching Kalshi...');
        const res = await fetch('https://api.elections.kalshi.com/trade-api/v2/markets?limit=100&status=open');
        const data = await res.json();
        const markets = data.markets || [];

        console.log(`Total Markets Fetched: ${markets.length}`);

        const rejected = markets.filter((m: any) => {
            const isMulti = m.ticker.includes('MULTIGAME');
            const isCustom = m.strike_type === 'custom';
            const isLong = m.title.length >= 120;
            return isMulti || isCustom || isLong;
        });

        const accepted = markets.filter((m: any) => {
            const isMulti = m.ticker.includes('MULTIGAME');
            const isCustom = m.strike_type === 'custom';
            const isLong = m.title.length >= 120;
            return !isMulti && !isCustom && !isLong;
        });

        console.log(`Accepted: ${accepted.length}`);
        console.log(`Rejected: ${rejected.length}`);

        if (rejected.length > 0) {
            console.log('--- Sample Rejected ---');
            rejected.slice(0, 3).forEach((m: any) => {
                console.log(`Title: ${m.title}`);
                console.log(`Type: ${m.strike_type}`);
                console.log(`Ticker: ${m.ticker}`);
                console.log('---');
            });
        }

        if (accepted.length > 0) {
            console.log('--- Sample Accepted ---');
            accepted.slice(0, 3).forEach((m: any) => {
                console.log(`Title: ${m.title}`);
                console.log(`Type: ${m.strike_type}`);
                console.log('---');
            });
        }

    } catch (e) {
        console.error(e);
    }
}

debugKalshi();
