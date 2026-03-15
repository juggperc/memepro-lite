
async function checkApi() {
    const url = 'https://frontend-api-v3.pump.fun/coins?offset=0&limit=5&sort=created_timestamp&order=DESC&includeNsfw=false';
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(JSON.stringify(data[0], null, 2));
    } catch (e) {
        console.error(e);
    }
}

checkApi();
