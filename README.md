# Demo Credit Wallet Service

## Table of Contents
- [Project Description](#project-description)
- [Live URL](#live-url)
- [ER Diagram](#er-diagram)
- [Project Architecture](#project-architecture)
- [Tech Stack](#tech-stack)
- [Design Decisions](#design-decisions)
- [Setup Instructions](#setup-instructions)
- [Running Tests](#running-tests)
- [API Endpoints](#api-endpoints)

---

## Project Description
Demo Credit is an MVP wallet service that enables users to:

- Register and log in securely
- Fund their wallet
- Transfer funds to other registered users
- Withdraw funds from their wallet
- View current wallet balance

Users flagged on the **Lendsqr Adjutor Karma blacklist** are automatically blocked from onboarding before any record is created in the database.

---

## Live URL
https://ibrahimadegboye-lendsqr-be-test.onrender.com
---

## ER Diagram

![ER Diagram](./erd.png)
> Created with [dbdesigner.net](https://app.dbdesigner.net)

### Relationships
- **users → wallets**: One-to-One (each user has exactly one wallet, created automatically on registration)
- **wallets → transactions**: One-to-Many (a wallet can have many transactions)

### Database Schema

**users**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary Key |
| full_name | VARCHAR | Not null |
| email | VARCHAR | Unique, not null |
| password | VARCHAR | bcrypt hashed |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

**wallets**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary Key |
| user_id | UUID | FK → users.id |
| balance | DECIMAL(15,2) | Default 0.00 |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

**transactions**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary Key |
| wallet_id | UUID | FK → wallets.id |
| type | ENUM | credit or debit |
| amount | DECIMAL(15,2) | Not null |
| description | VARCHAR | Not null |
| reference | VARCHAR | Unique per transaction |
| created_at | TIMESTAMP | Append-only, no updated_at |

---

## Project Architecture

```
src/
├── config/         # Database connection setup
├── controllers/    # HTTP request/response handling only
├── middlewares/    # Auth and error handling
├── migrations/     # Database schema versioning
├── routes/         # API route definitions
├── services/       # All business logic
├── tests/          # Unit and integration tests
└── types/          # TypeScript interfaces and types
```

Follows a strict layered pattern:

```
Request → Route → Controller → Service → Database
```

Each layer has exactly one responsibility and never crosses into another layer's concerns. Controllers never touch the database. Services never handle HTTP request/response objects.

---

## Tech Stack

| Technology | Purpose | Why |
|------------|---------|-----|
| Node.js LTS (v20) | Runtime environment | Fast, non-blocking I/O ideal for financial APIs |
| TypeScript | Language | Type safety catches bugs at compile time, not runtime |
| Express.js | Web framework | Minimal, flexible, industry standard for REST APIs |
| MySQL | Database | ACID-compliant relational DB — critical for financial transactions |
| Knex.js | Query builder / ORM | Clean migrations, full transaction support, SQL injection protection |
| bcryptjs | Password hashing | Industry standard for secure password storage |
| jsonwebtoken | Authentication | Stateless JWT auth — scalable, no session storage needed |
| Adjutor Karma API | Blacklist screening | Prevents onboarding of fraudsters and loan defaulters |
| Jest + Supertest | Testing | Reliable unit and integration testing with mocking support |
| crypto (Node built-in) | ID generation | `randomUUID()` — no external dependency, no ESM issues |

---

## Design Decisions

### 1. UUID over Auto-increment IDs
UUIDs prevent ID enumeration attacks — a common security risk in financial systems where sequential IDs can expose user counts or allow guessing of resource IDs.

### 2. Karma Blacklist Check Before Registration
The Adjutor Karma check is performed **before** any user record is created in the database. This ensures blacklisted users never enter the system at all, rather than being blocked after the fact.

### 3. Transaction Scoping for All Financial Operations
All operations touching multiple tables are wrapped in `db.transaction()`:

| Operation | Tables Affected | Why |
|-----------|----------------|-----|
| Register | users + wallets | User and wallet must be created together or not at all |
| Fund | wallets + transactions | Balance update and transaction log are atomic |
| Transfer | wallets (×2) + transactions (×2) | Debit and credit must both succeed or both roll back |
| Withdraw | wallets + transactions | Balance update and transaction log are atomic |

This guarantees atomicity — if any step fails, all changes are rolled back, preventing money from being lost or duplicated.

### 4. Separation of Concerns (Layered Architecture)
The project strictly separates:
- **Routes** — define endpoints only
- **Controllers** — handle HTTP request/response only
- **Services** — contain all business logic
- **Database** — data access only

This makes the codebase testable, maintainable, and easy to extend without breaking existing functionality.

### 5. OOP Principles Applied
- **Encapsulation** — business logic is encapsulated in service modules, hidden from controllers
- **Abstraction** — controllers never interact with the database directly
- **Single Responsibility** — each module has one job and does it only
- **DRY** — shared validators and response formatters used across all controllers

### 6. JWT Authentication
Stateless JWT tokens are used instead of sessions, making the API horizontally scalable without needing shared session storage. As specified in the requirements, this is a faux token-based authentication system.

### 7. One Wallet Per User
Each user is automatically assigned a single wallet upon registration inside a database transaction. This simplifies the data model and matches the MVP requirements.

### 8. DECIMAL over FLOAT for Money
All balance and amount columns use `DECIMAL(15,2)` instead of `FLOAT`. Floating point arithmetic is imprecise and dangerous for financial calculations. DECIMAL ensures exact values.

### 9. Transactions Table is Append-Only
The transactions table has no `updated_at` column — financial records are immutable. Once written, a transaction is never modified, only new ones are added.

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MySQL database
- Adjutor API key from [app.adjutor.io](https://app.adjutor.io)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Kwanza247/demo-credit-wallet.git
cd demo-credit-wallet

# 2. Install dependencies
npm install

# 3. Copy environment file and fill in your values
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=democredit

# Auth
JWT_SECRET=your_jwt_secret

# Adjutor Karma API
ADJUTOR_API_KEY=your_adjutor_api_key
ADJUTOR_BASE_URL=https://adjutor.lendsqr.com/v2
```

### Database Setup

```bash
# Run migrations
npm run migrate

# Rollback if needed
npm run migrate:rollback
```

### Running the App

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

---

## Running Tests

```bash
npm test
```

Tests cover **16 scenarios** across auth and wallet operations:

| Test Suite | Count | Coverage |
|------------|-------|----------|
| Auth tests | 7 | Registration, login, blacklist rejection, duplicate email, missing fields, wrong password, non-existent user |
| Wallet tests | 9 | Fund, transfer, withdraw, balance, zero amount, insufficient funds, self-transfer, no auth token, insufficient withdrawal |

Both **positive ✅** and **negative ❌** scenarios are covered for every feature.

---

## API Endpoints

### Base URL
http://localhost:3000/api/v1
### Authentication

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | /auth/register | No | Register a new user |
| POST | /auth/login | No | Login and receive JWT token |

### Wallet

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | /wallet/fund | Yes | Fund wallet with an amount |
| POST | /wallet/transfer | Yes | Transfer funds to another user |
| POST | /wallet/withdraw | Yes | Withdraw funds from wallet |
| GET | /wallet/balance | Yes | Get current wallet balance |

---

### Request & Response Examples

#### POST /auth/register
```json
// Request
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}

// Response 201
{
  "status": "success",
  "message": "Account created",
  "data": {
    "userId": "uuid-here",
    "walletId": "uuid-here"
  }
}
```

#### POST /auth/login
```json
// Request
{
  "email": "john@example.com",
  "password": "securepassword"
}

// Response 200
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid-here",
      "full_name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### POST /wallet/fund
```json
// Request (Bearer token required)
{
  "amount": 5000
}

// Response 200
{
  "status": "success",
  "data": {
    "balance": 5000
  }
}
```

#### POST /wallet/transfer
```json
// Request (Bearer token required)
{
  "recipient_email": "jane@example.com",
  "amount": 1000
}

// Response 200
{
  "status": "success",
  "data": {
    "message": "Transfer successful"
  }
}
```

#### POST /wallet/withdraw
```json
// Request (Bearer token required)
{
  "amount": 2000
}

// Response 200
{
  "status": "success",
  "data": {
    "balance": 3000
  }
}
```

#### GET /wallet/balance
```json
// Response 200
{
  "status": "success",
  "data": {
    "balance": 3000
  }
}
```

---

### Error Responses

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad request / validation error / blacklisted user |
| 401 | Unauthorized — invalid or missing token |
| 404 | Resource not found |
| 500 | Internal server error |

---

## License
ISC