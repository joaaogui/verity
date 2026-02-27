# Verity

AI-powered document validator. Upload a PDF or image, describe what you expect, and get instant classification, field extraction, and a match verdict — all powered by Gemini 2.0 Flash.

**Live demo:** [verity.joaog.space](https://verity.joaog.space)

**Design document:** [verity.joaog.space/docs](https://verity.joaog.space/docs)

**Test suite:** [verity.joaog.space/tests](https://verity.joaog.space/tests)

---

## What it does

An employee describes what document they expect (e.g., "A recent electricity bill from ConEd"), uploads the submitted file, and Verity:

1. **Classifies** the document type (utility bill, invoice, passport, tax form, etc.)
2. **Extracts** all visible fields (dates, amounts, names, account numbers)
3. **Matches** against the expectation with strict, literal comparison
4. **Explains** why it matches or doesn't — in natural language

Results stream in two stages: the verdict appears in **~3 seconds**, extracted fields fade in **~4 seconds later**.

## Features

- Two-stage streaming validation via Server-Sent Events
- AI autocomplete with ghost text (Tab to accept) and cached suggestions
- Strict expectation matching (electricity bill != water bill)
- PDF truncation to 3 pages for oversized documents
- Dark/light theme with custom 5-color palette
- Session history (persists across page refresh)
- Rate limiting, input sanitization, prompt injection defense
- Live test suite with 10 real-world documents
- Design document rendered at `/docs`

## Tech Stack

Next.js 16 · TypeScript · Tailwind CSS v4 · shadcn/ui · Google Gemini 2.0 Flash · Zod · sharp · pdf-lib · Vercel

## Getting Started

```bash
git clone git@github.com:joaaogui/verity.git
cd verity
npm install
```

Create `.env.local`:

```
GEMINI_API_KEY=your-gemini-api-key
```

Get a free API key at [aistudio.google.com](https://aistudio.google.com/apikey).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test Documents

The `test-docs/` directory contains sample PDFs for testing:

- `test-docs/real/` — Real-world documents (IRS W-2, invoices, passports, utility bills)
- `test-docs/` — Generated documents (lease agreements, lab reports, NDAs, insurance policies)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run Vitest tests |
| `npm run test:watch` | Run tests in watch mode |

## Architecture

```
POST /api/validate (SSE stream)
  → Stage 1: classifyDocument (~3s) → verdict event
  → Stage 2: extractFields (~4s)   → complete event

GET /api/suggest?q=... (cached JSON)
  → Static prefix match OR LRU cache OR Gemini call
```

See the [full design document](https://verity.joaog.space/docs) for architecture details, decision log, latency analysis, and test results.

## Deploy

```bash
vercel --prod
```

Requires `GEMINI_API_KEY` set as a Vercel environment variable.

## License

MIT
