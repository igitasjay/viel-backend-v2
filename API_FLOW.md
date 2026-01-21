# Gift Card Purchase API Flow

This guide details the step-by-step HTTP requests required to purchase a gift card.

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

## 2. Browse Gift Cards
Find the `giftCardId` you want to purchase.

**Request:**
`GET /giftcard/countries`
*Response: List of countries with codes (e.g., "NG", "US").*

**Request:**
`GET /giftcard/giftcards?countryCode=NG`

**Response Action:**
Select a gift card and copy its `_id` (e.g., `64f1b2c...`).

---

## 3. Initiate Purchase
Create a pending transaction AND get payment details.

**Request:**
`POST /giftcard/buy`

**Headers:**
`Authorization: Bearer <accessToken>`

**Body:**
```json
{
  "giftCardId": "64f1b2c...",
  "amount": 5000,
  "quantity": 1,
  "email": "recipient@email.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reference": "gift_65a123...", 
    "amount": 5000,
    "transactionId": "TRX_...",
    "paymentDetails": {
       "accountNumber": "1234567890",
       "bankName": "Wema Bank",
       "accountName": "Monnify Test"
    }
  }
}
```
**Action**: 
1. Save the `reference`.
2. Use the `paymentDetails` (Account Number & Bank) to make the transfer.

---

## 4. Payment & Verification
After the user pays (using the account details from Step 3), verify the payment to trigger true fulfillment.

**Request:**
`POST /transactions/:reference/verify`
*Replace `:reference` with the `reference` obtained in Step 3.*

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
2. Purchases the gift card from the provider.
3. Sends the code to the recipient.
