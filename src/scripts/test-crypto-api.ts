import axios from 'axios';

async function testApi() {
  try {
    const response = await axios.get('http://localhost:1200/api/v1/infra/crypto/coins/all');
    console.log('API Response:', JSON.stringify(response.data, null, 2));
    
    const assets = response.data.all || [];
    const testAssets = assets.filter((a: any) => a.code.startsWith('TEST_') || a.symbol?.startsWith('TEST_'));
    console.log('Test Assets in API response:', testAssets.length);
  } catch (error: any) {
    if (error.response) {
       console.error('API Error:', error.response.status, error.response.data);
    } else {
       console.error('Fetch failed:', error.message);
    }
  }
}

testApi();
