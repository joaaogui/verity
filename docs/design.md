# Verity — Design Document

## Goal

A web application for employees validating customer-submitted documents. Upload a document (PDF, image, or scan), describe what you expect it to be in free text, and get back within seconds: the document category, confidence score, extracted fields, a summary, and a strict match verdict.

**Live at:** https://verity.joaog.space

## Architecture

Single Next.js 16 (App Router) project handling both UI and backend logic, deployed on Vercel.

```
┌──────────────────────────────────────────────┐
│               Next.js App (Vercel)           │
│                                              │
│  Frontend (React + shadcn/ui + TanStack)     │
│       │ fetch('/api/validate')               │
│       │ fetch('/api/suggest')                │
│  API Routes                                  │
│       │ Vision API call                      │
│  LLM Adapter Layer (Gemini 2.0 Flash)        │
└──────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI Components | shadcn/ui (Button, Input, Card, Badge, Label, Alert, Tooltip) |
| Styling | Tailwind CSS v4 + custom palette (Dust Grey, Gunmetal, Pacific Blue, Rosy Copper, Glaucous) |
| Fonts | Inter (body), Outfit (display title) |
| Data fetching | TanStack Query (`useMutation` for validation, `useQuery` for autocomplete) |
| AI engine | Google Gemini 2.0 Flash via `@google/genai` |
| Image processing | `sharp` (resize to 768px JPEG) |
| PDF processing | `pdf-lib` (page count + truncation to 3 pages) |
| File thumbnail | Lightweight icon with extension badge (images use object URL preview) |
| Schema validation | Zod (LLM response parsing with retry) |
| Input sanitization | Custom `sanitizeUserInput()` — strips control chars, enforces max length |
| Rate limiting | In-memory sliding window per IP (10/min validate, 30/min suggest) |
| Theming | `next-themes` (light default, dark mode toggle) |
| Deployment | Vercel |
| Domain | verity.joaog.space |

## Decision Log

### Single-pass vision LLM vs OCR pipeline

**Chose: Two-stage streaming.** Split into a fast classification call (~3s) and a background field extraction call (~4s more), streamed via SSE.

- *Why*: The user's primary question — "does this document match?" — is answered in ~3 seconds. Field extraction (the slow part with many output tokens) runs in the background. Gemini handles PDFs natively — no conversion step.
- *Evolution*: v1.0 used a single-pass call (4-6s for everything). v1.3 split it into two stages to improve perceived latency.
- *Alternative considered*: OCR-first pipeline (Tesseract/Google Vision -> text -> LLM). Would add complexity and lose visual layout context.
- *Tradeoff*: Two LLM calls per validation = more total tokens than single-pass. But the UX gain (3s to verdict vs 5s) is worth it.

### Gemini Flash vs OpenAI GPT-4o vs Anthropic Claude

**Chose: Gemini 2.0 Flash.** Free tier, native PDF support, structured JSON output.

- *Why*: Fastest vision model with free API access. Native PDF upload means no PDF-to-image conversion overhead. `responseMimeType: "application/json"` gives structured output without post-processing.
- *Alternative considered*: OpenAI GPT-4o-mini (faster for text, ~1-2s, but no native PDF support — would need pdf-to-image conversion adding latency back). Anthropic Claude Haiku (fast for text, but vision is slower and no native PDF).
- *Tradeoff*: Gemini occasionally returns malformed JSON on complex documents. Mitigated by automatic retry (2 attempts) and control character stripping.

### Strict matching vs fuzzy matching

**Chose: Strict.** Every specific detail in the expectation must be satisfied.

- *Why*: For document validation, false positives are worse than false negatives. An employee needs to know "this is NOT what was expected." A wastewater bill should not match "electricity bill" even though both are utilities. Blank forms should not match "completed form."
- *Tradeoff*: May reject edge cases that a human would accept. But for a validation tool, precision matters more than recall.

### No database / stateless design

**Chose: No persistence.** History lives in `sessionStorage`, clears on tab close.

- *Why*: Document validation is inherently stateless — each upload is independent. Adding a database adds deployment complexity (connection pooling, migrations, hosting) without clear user value. Session history covers the "compare recent results" use case.
- *When to reconsider*: If the tool needs audit trails, team sharing, or analytics across validations.

### Next.js monolith vs separate frontend/backend

**Chose: Monolith.** One project, one `npm run dev`, one deploy.

- *Why*: API routes run server-side (Gemini key stays safe), no CORS issues, shared TypeScript types between client and server. Vercel deploys it as a single unit.
- *Tradeoff*: Can't scale frontend and backend independently. Acceptable for a tool app with low concurrent users.

## Approach: Two-Stage Streaming Validation

The validation is split into two sequential LLM calls, streamed to the frontend via Server-Sent Events (SSE):

**Stage 1 — Classify (~3s):** A minimal prompt asks only for category, confidence, match verdict, and explanation. No field extraction, no summary. Short output = faster inference. The result streams to the frontend immediately.

**Stage 2 — Extract (~4s more):** A second prompt asks for all extracted fields and a summary. Runs on the same document. Fields fade into the UI progressively while the user already has the verdict.

```
User clicks "Validate"
    │
    ▼ ~3s
┌─────────────────────────────────┐
│ VERDICT: Match/No Match (shown) │  ← User sees the answer here
│ Category, Confidence, Why       │
│ [Extracting fields... skeleton] │
└─────────────────────────────────┘
    │
    ▼ ~4s more
┌─────────────────────────────────┐
│ VERDICT (already shown)         │
│ Summary (fades in)              │
│ Extracted Fields (fades in)     │  ← Fields populate progressively
└─────────────────────────────────┘
```

PDFs are sent as `application/pdf` (Gemini handles natively). Images are resized to 768px width JPEG. PDFs over 3 pages are truncated to the first 3 pages using `pdf-lib`.

The prompts enforce **strict expectation matching**:
1. Match the document type literally (electricity bill != water bill)
2. Distinguish blank/template forms from completed/filled forms
3. Verify specific issuers, date ranges, and named individuals
4. Treat user input as untrusted (prompt injection defense)

**Generation config:** `temperature: 0`, `responseMimeType: "application/json"`. Classification uses `maxOutputTokens: 256` (fast). Extraction uses `maxOutputTokens: 1024`.

**Retry:** Each stage retries once on parse failure. Control characters are stripped before parsing.

**Backward compatibility:** A single-pass `validateDocument` method is preserved for the test suite (server actions don't use SSE).

## API Endpoints

### `POST /api/validate`

Main validation endpoint. Returns a **Server-Sent Events stream** with two events. Rate limited to 10 requests/minute/IP.

**Request:** `file` (binary, max 5MB) + `expectation` (string, sanitized to 500 chars) as `multipart/form-data`

**Response:** `Content-Type: text/event-stream`

**Event 1 — `verdict` (~3s):**
```typescript
{
  category: string;
  categoryLabel: string;
  confidence: number;
  matchesExpectation: boolean;
  matchExplanation: string;
  processingTimeMs: number;
  truncated: boolean;
}
```

**Event 2 — `complete` (~7-8s total):**
```typescript
{
  extractedFields: Record<string, string>;
  summary: string;
  processingTimeMs: number;
}
```

**Error event:** `{ error: string, code: "validation_error" | "parse_error" | "provider_error" | "rate_limit" | "unknown" }`

### `GET /api/suggest?q=<partial_text>`

AI-powered autocomplete. Rate limited to 30 requests/minute/IP.

**Response:** `string[]` (4 suggestions)

Cost optimization:
- 10 static prefix matches for common queries (zero LLM cost)
- 200-entry in-memory LRU cache (repeated prefixes served from memory)
- Minimum query length: 3 characters
- Prompt injection fence on untrusted input

## LLM Provider Adapter

```typescript
interface DocumentPart {
  buffer: Buffer;
  mimeType: string;  // "application/pdf" | "image/jpeg"
}

interface LLMProvider {
  validateDocument(
    parts: DocumentPart[],
    expectation: string
  ): Promise<ValidatorResponse>;
}
```

Current implementation: `GeminiProvider` with automatic retry. The adapter interface allows swapping to OpenAI or Anthropic without touching the API route.

## Latency Analysis

### Where the time goes (two-stage)

| Step | Time | User sees |
|------|------|-----------|
| File upload + processing | ~150ms | Spinner |
| **Stage 1: Classify (Gemini)** | **2-3.5s** | **Verdict appears** |
| Stage 2: Extract fields (Gemini) | 3-5s more | Fields fade in |
| **Time to verdict** | **~3s** | |
| **Total time** | **7-8s** | |

The user gets the answer (match/no match) in ~3 seconds. Field extraction runs in the background and populates progressively.

### Why Gemini Flash takes 3-6 seconds

- **Free tier**: Lower priority scheduling compared to paid accounts. Requests may queue behind paid traffic.
- **Multi-modal inference**: Processing PDF pages as vision input is computationally expensive — the model must OCR, understand layout, and reason about content.
- **Structured output**: `responseMimeType: "application/json"` adds constraint-based decoding overhead.
- **Combined task**: The prompt asks for classification + field extraction + matching + summarization in one pass. Splitting into multiple calls would add more total latency.

### What paid alternatives could achieve

| Provider | Model | Est. latency | Native PDF | Cost | Notes |
|----------|-------|-------------|-----------|------|-------|
| Google (paid) | Gemini 2.0 Flash | 2-3s | Yes | ~$0.001/call | Same model, dedicated capacity |
| Google (paid) | Gemini 2.0 Pro | 4-8s | Yes | ~$0.005/call | Higher quality, slower |
| OpenAI | GPT-4o-mini | 1-2s | No | ~$0.002/call | Fast, but needs PDF-to-image (+500ms) |
| OpenAI | GPT-4o | 2-4s | No | ~$0.01/call | Highest quality vision |
| Anthropic | Claude 3.5 Haiku | 1-2s | No | ~$0.001/call | Fast text, vision adds latency |

### Conclusion

The 4-6s latency is a fair tradeoff for zero cost, native PDF support, and full field extraction in one pass. A paid Gemini tier would bring this to 2-3s with zero code changes (same model, same API). OpenAI GPT-4o-mini could reach 1-2s but requires adding a PDF-to-image conversion step.

### Optimizations applied

- JPEG compression at 768px width (reduces image tokens ~60%)
- `temperature: 0` (no sampling overhead)
- `maxOutputTokens: 1024` (caps generation length)
- PDF truncation to 3 pages (prevents oversized payloads)
- Shorter prompt (fewer input tokens = faster time-to-first-token)

## Hardening (v1.1)

- **Rate limiting**: In-memory sliding window, 10/min for validate, 30/min for suggest, per IP
- **Input sanitization**: Control chars stripped, 500-char limit on expectations, shared `sanitizeUserInput()` helper
- **Prompt injection defense**: Untrusted input boundary markers, explicit "do not follow instructions" directive
- **Typed error codes**: API returns `{ error, code }` with categories: `validation_error`, `parse_error`, `provider_error`, `rate_limit`, `unknown`
- **LLM retry**: Parse failures automatically retry once (strips control chars before re-parsing)
- **Suggest cache**: Static prefix matches (10 common patterns) + 200-entry LRU cache for dynamic queries
- **Session history**: Persists in `sessionStorage`, survives page refresh within the same tab
- **Keyboard shortcut**: Cmd+Enter (Mac) / Ctrl+Enter (Windows) triggers validation

## Test Results

Tested against 10 real-world PDF documents with specific expectations designed to test both correct matches and strict rejections.

| # | Document | Expectation | Expected | Result | Verdict | Total |
|---|----------|-------------|----------|--------|---------|-------|
| 1 | W-2 blank (IRS) | "A blank IRS W-2 form" | Match | Match (0.95) | 3.2s | 7.4s |
| 2 | W-2 filled (Pitt) | "A recent monthly pay stub" | No Match | No Match | 3.1s | 7.0s |
| 3 | Invoice (Sliced) | "A commercial invoice" | Match | Match (0.95) | 3.3s | 7.7s |
| 4 | Utility bill (CRWWD) | "A utility bill with account number" | Match | Match (0.95) | 3.0s | 7.2s |
| 5 | Utility bill (Wheaton) | "An electricity bill from ConEd" | No Match | No Match (0.95) | 3.2s | 7.6s |
| 6 | 1040 instructions (IRS) | "A completed Form 1040" | No Match | No Match (0.95) | 3.5s | 8.4s |
| 7 | Passport (Malaysia) | "A passport scan with photo" | Match | Match (0.92) | 3.0s | 7.1s |
| 8 | Passport (Ultracamp) | "A US driver's license" | No Match | No Match (0.95) | 3.4s | 7.6s |
| 9 | 1099 form (IRS) | "An IRS Form 1099" | Match | Match (0.95) | 3.3s | 7.8s |
| 10 | W-4 form (IRS) | "A completed W-2" | No Match | No Match (0.95) | 3.6s | 8.4s |

**Pass rate: 10/10** (after retry mechanism and prompt improvements)

**Average time to verdict: 3.3s** (user sees Match/No Match here)

**Average total time: 7.6s** (fields fully populated)

Key observations:
- Two-stage architecture delivers the verdict in ~3s consistently across all document types
- Strict matching works correctly across all test cases
- Total time is higher than single-pass (~7.6s vs ~5.4s) but the UX is better because the user gets the answer in half the time

## UI Design

### Brand

- **Name:** Verity (Latin for "truth")
- **Display font:** Outfit (geometric sans-serif, AI/tech feel)
- **Body font:** Inter
- **Primary color:** Pacific Blue (#58a8c3)
- **Palette:** Dust Grey (#e3d5d5), Gunmetal (#3d4146), Rosy Copper (#cd694e), Pacific Blue (#58a8c3), Glaucous (#6f81d9)
- **Favicon:** Pacific Blue rounded square with white serif "V"

### Layout

- **Single column** on small/medium screens, **two-column** on xl+ (1280px): input panel left, results right
- Max width: `max-w-6xl` (1152px)
- Two-column layout only activates once results exist

### Components

1. **Expectation input** — Text field with AI-powered ghost text completion (Tab to accept), dropdown with 4 AI suggestions (debounced 400ms), and 8 quick-pick badge chips (4 visible + expandable)
2. **Upload zone** — Drag-and-drop area with file icon + extension badge thumbnail (images show object URL preview)
3. **Result card** — Status badge (Match/No Match/Uncertain), category badge, confidence + time with tooltips. "Why" section with colored left border accent. Summary in muted background. Stacked label-over-value extracted fields. Fade-in + slide-up animation.
4. **Result skeleton** — Pulse loading placeholder matching result card layout, shown during LLM processing
5. **Empty state** — "How it works" 3-step guide (Describe, Upload, Validate) shown before first validation
6. **History list** — Session-persisted (survives refresh), entries are expandable (click to show full result card inline)
7. **Theme toggle** — Sun/Moon icon in header, light/dark via next-themes
8. **Design doc page** — `/docs` renders `docs/design.md` as styled HTML at build time
9. **Test suite page** — `/tests` runs all test documents and shows live pass/fail dashboard

### Design System (shadcn/ui)

Primitives: Button, Input, Card, Badge, Label, Alert, Tooltip. All use semantic CSS variables that adapt to light/dark themes.

Status colors:
- Match: `text-success` / `bg-success/10`
- No Match: `text-destructive` / `bg-destructive/10`
- Uncertain: `text-warning` / `bg-warning/10`

## Error Handling

| Error | User message | Code | Strategy |
|-------|-------------|------|----------|
| File > 5MB | "File exceeds 5MB limit" | `validation_error` | Client-side check + server validation |
| Bad format | "Unsupported file type" | `validation_error` | Client MIME + server validation |
| PDF > 3 pages | Truncated silently, badge shown | — | pdf-lib extracts first 3 pages |
| LLM parse failure | Auto-retry once | — | Strip control chars, retry, then `parse_error` |
| LLM timeout | "An unexpected error occurred" | `unknown` | Auto-retry once (React Query) |
| Rate limit exceeded | "Too many requests" | `rate_limit` | 429 with Retry-After header |
| API key issue | "AI service configuration error" | `provider_error` | Logged server-side |
| Network error | Error alert with message | — | React Query error state |

## File Structure

```
doc-validator/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, fonts (Inter + Outfit), providers
│   │   ├── page.tsx                # Main page, two-column layout, state management
│   │   ├── globals.css             # Tailwind v4, shadcn theme, custom palette
│   │   ├── icon.svg                # Favicon (Pacific Blue "V")
│   │   ├── docs/page.tsx           # Design doc rendered as HTML
│   │   ├── tests/page.tsx          # Live test suite dashboard
│   │   └── api/
│   │       ├── validate/route.ts   # Document validation endpoint
│   │       └── suggest/route.ts    # AI autocomplete endpoint (cached)
│   ├── components/
│   │   ├── expectation-input.tsx   # Input + ghost text + dropdown + badges
│   │   ├── upload-zone.tsx         # Drag-and-drop + file icon thumbnail
│   │   ├── file-thumbnail.tsx      # File icon with extension badge
│   │   ├── result-card.tsx         # Validation result display
│   │   ├── result-skeleton.tsx     # Loading skeleton placeholder
│   │   ├── history-list.tsx        # Expandable session history
│   │   ├── empty-state.tsx         # "How it works" first-time guide
│   │   ├── theme-toggle.tsx        # Light/dark mode switcher
│   │   ├── providers.tsx           # ThemeProvider + QueryClient + TooltipProvider
│   │   └── ui/                     # shadcn/ui primitives (7 components)
│   ├── hooks/
│   │   ├── use-validate.ts         # useMutation for /api/validate
│   │   └── use-suggestions.ts      # useQuery with 400ms debounce for /api/suggest
│   ├── lib/
│   │   ├── schemas.ts              # Zod schemas, file type/size constants
│   │   ├── api-client.ts           # Frontend fetch wrapper (handles non-JSON errors)
│   │   ├── sanitize.ts             # Input sanitization (control chars, length limit)
│   │   ├── rate-limit.ts           # IP-based sliding window rate limiter
│   │   ├── utils.ts                # cn() helper (tailwind-merge + clsx)
│   │   ├── llm/
│   │   │   ├── types.ts            # LLMProvider + DocumentPart interfaces
│   │   │   ├── constants.ts        # Shared GEMINI_MODEL + client factory
│   │   │   ├── provider.ts         # Provider factory
│   │   │   ├── gemini-provider.ts  # Gemini 2.0 Flash with retry
│   │   │   └── prompt.ts           # Strict validation prompt with injection defense
│   │   └── document/
│   │       ├── image-processor.ts  # Resize to 768px JPEG via sharp
│   │       └── pdf-processor.ts    # pdf-lib page count + truncation
│   └── lib/__tests__/              # Vitest tests (schemas, prompt, image processor)
├── test-docs/                      # Generated test PDFs (lease, lab report, NDA, etc.)
├── test-docs/real/                 # Real-world PDFs (IRS forms, invoices, passports)
├── docs/design.md                  # This document
├── .env.local                      # GEMINI_API_KEY
├── .npmrc                          # Force public npm registry
├── components.json                 # shadcn/ui config
├── next.config.ts                  # serverExternalPackages for sharp
├── vitest.config.ts                # Test config with jsdom + path aliases
├── tsconfig.json
└── package.json
```

## Deployment

- **Platform:** Vercel
- **Domain:** verity.joaog.space (DNS via Vercel nameservers)
- **Environment variables:** `GEMINI_API_KEY` (set via `vercel env`)
- **Build:** `npm run build` via Vercel's Next.js integration
- **Deploy:** `vercel --prod` from CLI

## Scope

**Built:**
- Single document upload (PDF, JPG, PNG, WebP) with file icon preview
- Free-text expectation with AI autocomplete (ghost text + dropdown + cached suggestions)
- Quick-pick badge chips (8 presets, 4 visible + expandable)
- Strict classification and field extraction via Gemini Flash with automatic retry
- Match/No Match/Uncertain verdicts with explanations
- PDF truncation to 3 pages for oversized documents
- Expandable session history (persists across page refresh)
- Light/dark theme with custom 5-color palette
- Responsive two-column layout on large screens
- Loading skeleton, empty state, transitions
- Rate limiting, input sanitization, prompt injection defense
- Typed error codes for debugging
- Design doc page at `/docs`
- Live test suite at `/tests`
- Deployed to production on custom domain

**Out of scope (future):**
- Batch upload / multi-document comparison
- Persistent storage / database
- User accounts and authentication
- Webhook notifications for automated pipelines
- Custom category training / fine-tuning
- OCR fallback pipeline for degraded scans
