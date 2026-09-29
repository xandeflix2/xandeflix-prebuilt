async function testDoh() {
  try {
    const cf = await fetch('https://1.1.1.1/dns-query?name=234.bxdtxs.space&type=A', {
      headers: { 'Accept': 'application/dns-json' }
    });
    const cfJson = await cf.json();
    console.log('CF DoH:', cfJson.Answer);
  } catch (e) {
    console.error('CF DoH error:', e.message);
  }

  try {
    const google = await fetch('https://8.8.8.8/resolve?name=234.bxdtxs.space&type=A', {
      headers: { 'Accept': 'application/json' }
    });
    const googleJson = await google.json();
    console.log('Google DoH:', googleJson.Answer);
  } catch (e) {
    console.error('Google DoH error:', e.message);
  }
}

testDoh();
