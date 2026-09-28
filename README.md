# Bedrock Streaming Chat

A small Next.js (App Router) + TypeScript demo that streams a Claude response
from **Amazon Bedrock** straight into the browser, token by token, using
Bedrock's `ConverseStream` API.

Built as a portfolio piece to demonstrate the specific intersection a lot of
"AI platform engineer" job postings ask for: TypeScript + Next.js on the
frontend, combined with LLM routing and streaming response handling on the
backend.

## What it demonstrates

- **TypeScript** end to end — API route, client component, and the AWS SDK
  types are all statically typed (no `any`).
- **Next.js App Router** — a server-side API route (`app/api/chat/route.ts`)
  and a client component (`app/page.tsx`) in the same project.
- **LLM streaming** — the API route opens a `ConverseStreamCommand` against
  Bedrock and re-streams each token to the browser over a plain
  `ReadableStream`, no third-party streaming library required.
- **Client-side stream consumption** — the UI reads the response body with
  `getReader()` and appends each chunk to the UI as it arrives, so the
  response visibly "types" in rather than appearing all at once.

## Prerequisites

- Node.js 18.17+
- An AWS account with **Amazon Bedrock model access enabled** for a Claude
  model (Bedrock console → Model access). This demo defaults to the Claude
  4.5 Sonnet cross-region inference profile
  (`us.anthropic.claude-sonnet-4-5-20250929-v1:0`) — change `MODEL_ID` in
  `app/api/chat/route.ts` if you've enabled a different model or region.
- AWS credentials with `bedrock:InvokeModelWithResponseStream` permission.

## Setup

```bash
npm install
cp .env.local.example .env.local
# edit .env.local with your AWS credentials and region
npm run dev
```

Open http://localhost:3000 and send a message.

## Project structure

```
app/
  api/chat/route.ts   # Server route: calls Bedrock, streams tokens back
  page.tsx             # Client chat UI: sends messages, renders the stream
  layout.tsx           # Root layout
package.json
tsconfig.json
next.config.js
```

## Notes / next steps if extending this

- Swap `ConverseStreamCommand` for `ConverseCommand` (non-streaming) to
  compare the UX difference — streaming matters most for longer responses.
- Add conversation history by passing prior turns into the `messages` array
  instead of just the latest message.
- For production use, add request validation, rate limiting, and move the
  model ID / inference config behind environment variables rather than a
  hardcoded constant.


# AWS SECURITY NOTE

.env.local contains real AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) and must never be committed to version control. It is already excluded via .gitignore. Do not paste real credentials into .env.local.example — that file is a template only, meant to show which variables are required.

If you believe AWS credentials have ever been committed or exposed (e.g., pushed to a public repo, pasted into a chat, or shared in a screenshot), rotate them immediately in the IAM console — deactivate the old access key and generate a new one — rather than assuming exposure is harmless.

For anything beyond local development, prefer a scoped IAM role or short-lived credentials (e.g., via AWS SSO / STS) over long-lived access keys in a file at all.
