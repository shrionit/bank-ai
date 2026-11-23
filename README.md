# Bank AI Demo

Bank AI is a full-stack conversational banking demo for DBS Bank Singapore. It uses a React chat interface, an Express API, Ollama for local tool-calling AI responses, and SQLite through Prisma to demonstrate customer onboarding and card issuance.

> **Assignment/demo notice:** This is a simple demonstration project, not a production banking application. There is much more that can be implemented, such as fetching every card issued to the current user, customer account balances and transactions, card activation or replacement, authentication and authorization, audit logging, real provider integrations, and stronger prompts and validation. The prompt and tools can also be expanded and improved significantly.

## Features

- Chat with a DBS banking assistant through text
- Optional speech-to-text and text-to-speech through Cartesia
- Ask about DBS bank information, available services, cards, eligibility, and fees
- Follow a conversational customer onboarding flow
- Verify a customer by email
- Issue a demo card linked to a customer in SQLite
- Keep chat history in a session
- Return both spoken summaries and structured text or list details

## Technology

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Express 5, TypeScript
- **AI:** Ollama-compatible local model tool calling
- **Database:** SQLite with Prisma
- **Voice:** Cartesia SDK

## Project Structure

```text
bank-ai/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── dev.db
│   └── src/
│       ├── providers/
│       ├── services/
│       └── datasource/
└── frontend/
    └── src/
        ├── api/
        ├── components/
        ├── hooks/
        ├── providers/
        └── voice/
```

## Prerequisites

- Node.js 20.19 or newer
- npm
- Ollama running locally
- A Cartesia account and API credentials for voice features only

## Ollama Setup

Install Ollama, start the service, and pull the default model:

```powershell
ollama pull qwen3:8b
```

Ollama normally listens at `http://localhost:11434`. Verify it with:

```powershell
curl http://localhost:11434/api/tags
```

## Environment Configuration

### Backend

Copy the example environment file:

```powershell
cd backend
Copy-Item .env.example .env
```

Default values:

```dotenv
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:8b
DATABASE_URL="file:./dev.db"
```

### Frontend

Copy the example environment file:

```powershell
cd ../frontend
Copy-Item .env.example .env
```

For text chat, the frontend environment file is optional. To enable voice features, add your Cartesia credentials:

```dotenv
VITE_CARTESIA_API_KEY=your_cartesia_key
VITE_CARTESIA_VOICE_ID=your_voice_id
```

## Install and Run

Open two PowerShell terminals.

### Terminal 1: Backend

From the repository root:

```powershell
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

The API runs at `http://localhost:5000`. Open `http://localhost:5000/` to confirm the status response.

### Terminal 2: Frontend

From the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/`.

The Vite development server proxies `/api` requests to `http://localhost:5000`.

## Available Demo Flows

Try prompts such as:

- “What services does DBS offer?”
- “Show me travel or miles credit cards.”
- “What are the common credit card fees?”
- “I want to apply for the DBS Altitude Visa Signature.”
- “My email is demo@example.com.”

For a new customer, the assistant follows a confirmation-based onboarding flow before calling the database tools. Generated card numbers and customer records are demo data only.

## Backend API

- `GET /` — API health response
- `GET /api/greet?name=User` — simple greeting
- `POST /api/session` — create or reset an in-memory chat session
- `GET /api/session?sessionId=<id>` — inspect a session
- `GET /api/session` — list active in-memory sessions
- `POST /api/chat` — send `{ "text": "Your prompt", "sessionId": "optional-id" }`

Chat sessions are stored in memory and are cleared when the backend restarts. The Prisma database remains persistent in SQLite.

## Production Build

Build the frontend:

```powershell
cd frontend
npm run build
npm run preview
```

Build and start the backend:

```powershell
cd backend
npm run build
npm start
```

## Improvement Ideas

This project has room for much more work beyond the assignment:

- Fetch all cards issued to the current authenticated user
- Add customer-specific balances, transactions, statements, transfers, and card status
- Add robust error handling
- Response structuring using latest llm api configs
- Add and Improve authentication and map sessions to real users
- Add real authorization, rate limiting, validation, and audit trails
- Persist chat sessions instead of keeping them only in memory
- Improve the system prompt and tool-calling reliability
- Add card activation, cancellation, replacement, and spending-limit tools
- Add confirmation and human approval for sensitive banking actions
- Integrate real bank APIs and production-grade voice providers
- Add tests, CI checks, containerized services, and deployment configuration
