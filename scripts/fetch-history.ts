import axios from 'axios';

const BASE_URL = 'http://localhost:1200/api/v1';

async function fetchHistory() {
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'imailasjay@gmail.com',
      password: '123456',
    });

    const accessToken = loginResponse.data.accessToken;
    const headers = { Authorization: `Bearer ${accessToken}` };

    const historyResponse = await axios.get(`${BASE_URL}/transactions/history`, { headers });
    
    console.log(JSON.stringify(historyResponse.data, null, 2));
  } catch (error: any) {
    console.error('Fetch failed:', error.response?.data || error.message);
  }
}

fetchHistory();
