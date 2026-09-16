# PayTM Clone

A full-stack digital wallet application inspired by PayTM, built as a hands-on security and testing exercise. Started as a basic MERN CRUD app, then hardened through a full audit-and-fix cycle covering authentication, transaction integrity, and test coverage.

![Backend Tests](https://github.com/abhijeetat9/paytm-clone/actions/workflows/test.yml/badge.svg)

## Features

- User signup/signin with JWT authentication
- Account balances stored as MongoDB Decimal128 (avoids floating-point rounding errors in money handling)
- Peer-to-peer money transfers with server-side amount validation
- Rate-limited auth endpoints to prevent brute-force attempts
- Full Jest/Supertest integration test suite, including a dedicated MongoDB replica set for transaction testing

## Tech Stack

**Backend:** Node.js, Express 5, Mongoose, JWT, Zod, express-rate-limit
**Frontend:** React 19, Vite, Tailwind CSS, React Router v7
**Testing:** Jest, Supertest, mongodb-memory-server
**CI:** GitHub Actions

## Security Fixes Applied

This project went through a deliberate security audit-and-fix pass. Notable issues found and resolved:

- **Negative-amount transfer exploit** — the transfer endpoint didn't validate that amounts were positive, allowing a negative transfer to *increase* the sender's balance. Fixed with Zod schema validation (`amount: zod.number().positive()`).
- **Non-expiring JWTs** — tokens were signed without an expiry. Fixed by adding `expiresIn`.
- **Unauthenticated user search endpoint** — `/user/bulk` had no auth middleware. Fixed by requiring a valid JWT.
- **Permissive CORS** — backend accepted requests from any origin. Restricted to a configured origin via `CORS_ORIGIN`.
- **Floating-point money storage** — balances were stored as JS `Number`, risking rounding errors. Migrated to `Decimal128`.
- **No rate limiting** — auth endpoints were open to brute-force attempts. Added `express-rate-limit`.

## Running Locally

### Backend
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```
PORT=3001
MONGO_URL=<your MongoDB connection string>
JWT_SECRET=<a random secret>
JWT_EXPIRES_IN=1h
CORS_ORIGIN=http://localhost:5173
```

```bash
npm test        # run the test suite
node index.js   # start the server
```

### Frontend
```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:
```
VITE_API_URL=http://localhost:3001
```

```bash
npm run dev
```
