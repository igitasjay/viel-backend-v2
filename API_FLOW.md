# Payment API Flows

This guide details the step-by-step HTTP requests for purchasing Gift Cards and Crypto.

## Prerequisites
- **Base URL**: `http://localhost:1200/api/v1`
- **Content-Type**: `application/json`

---

## 1. Authentication
You must be logged in to initiate a purchase.

**Request:**
`POST /auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response Action:**
Copy the `accessToken` from the response. Use it in the `Authorization` header for subsequent requests.

---

## 2. Buy Gift Card Flow

### Step A: Browse
`GET /giftcard/countries` -> `GET /giftcard/giftcards?countryCode=NG`

### Step B: Initiate Purchase
**Request:** `POST /giftcard/buy`
**Body:**
```json
{
  "giftCardId": "64f1...",
  "amount": 5000,
  "quantity": 1,
  "email": "recipient@email.com"
}
```
**Response:** Includes `reference` and `paymentDetails`.

### Step C: Verify
**Request:** `POST /transactions/:reference/verify`
**Body:** `{}`

---

## 3. Buy Crypto Flow

### Step A: Initiate Purchase
Create a pending transaction AND get payment details.

**Request:**
`POST /fiat/buy-crypto`

**Headers:**
`Authorization: Bearer <accessToken>`

**Body:**
```json
{
  "coin": "USDT",
  "network": "TRC20",
  "amount": 20,              // Amount in Crypto (e.g., 20 USDT)
  "walletAddress": "TVk..."  // The user's wallet address
}
```

**Response:**
```json
{
  "message": "Transaction initialized. Please proceed to payment.",
  "data": {
    "reference": "buy_65a...", 
    "naira_amount": "30000.00",
    "transactionId": "TRX_...",
    "paymentDetails": {
       "accountNumber": "1234567890",
       "bankName": "Wema Bank",
       "accountName": "Monnify Test",
       ...
    }
  }
}
```

### Step B: Payment & Verification
After the user pays (using the account details from Step A), verify the payment.

**Request:**
`POST /transactions/:reference/verify`
*Replace `:reference` with the `reference` obtained in Step A.*

**Body:** `{}` (Empty)

**Response:**
```json
{
  "message": "Payment verified and processed",
  "status": "paid"
}
```

**Outcome**: The system checks Monnify. If paid, it automatically:
1. Marks transaction as `paid`.
2. Triggers the crypto dispatch logic (currently a placeholder in `monnify.webhook.ts` until dispatch logic is connected).
