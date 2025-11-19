const https = require('https');
import { Request, Response } from 'express';

const params = JSON.stringify({
  email: 'customer@email.com',
  amount: '10000',
  metadata: {
    custom_fields: [
      {
        value: 'makurdi',
        display_name: 'Donation for',
        variable_name: 'donation_for',
      },
    ],
  },
  bank: {
    code: '057',
    account_number: '0000000000',
  },
  birthday: '1995-12-23',
});

const options = {
  hostname: 'api.paystack.co',
  port: 443,
  path: '/charge',
  method: 'POST',
  headers: {
    Authorization: 'Bearer SECRET_KEY',
    'Content-Type': 'application/json',
  },
};

const req = https
  .request(options, (res: Response) => {
    let data = '';

    res.on('data', (chunk: any) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(JSON.parse(data));
    });
  })
  .on('error', (error: Error) => {
    console.error(error);
  });

req.write(params);
req.end();
