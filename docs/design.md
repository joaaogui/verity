# Verity — Design Document

## Goal

A web application for employees validating customer-submitted documents. Upload a document (PDF, image, or scan), describe what you expect it to be in free text, and get back within seconds: the document category, confidence score, extracted fields, a summary, and a strict match verdict.

**Live at:** https://verity.joaog.space

**Original brief:** "Design a document validator that reads a 3-page document within 5 seconds and decides whether the content is matching the user's expectations. Example: Upload a utility bill and within 2 seconds a response comes back with the category of the document."

## Architecture

Single Next.js 16 (App Router) project handling both UI and backend logic, deployed on Vercel.

```
┌──────────────────────────────────────────────┐
│               Next.js App (Vercel)           │
│                                              │
│  Frontend (React + shadcn/ui)                │
│       │ fetch('/api/validate') [SSE stream]  │
│       │ fetch('/api/suggest')  [cached]      │
│  API Routes                                  │
│       │ Two-stage LLM calls                  │
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
| Data fetching | Custom SSE stream consumer for validation, TanStack Query `useQuery` for autocomplete |
| AI engine | Google Gemini 2.0 Flash via `@google/genai` |
| Image processing | `sharp` (resize to 768px JPEG) |
| PDF processing | `pdf-lib` (page count + truncation to 3 pages) |
| File thumbnail | Lightweight icon with extension badge (images use object URL preview) |
| Schema validation | Zod v4 (LLM response parsing with retry) |
| Input sanitization | Custom `sanitizeUserInput()` — Unicode property class `\p{Cc}`, max length |
| Rate limiting | In-memory sliding window per IP (10/min validate, 30/min suggest) |
| Theming | `next-themes` (light default, dark mode toggle) |
| Markdown rendering | `react-markdown` + `remark-gfm` + `@tailwindcss/typography` |
| Deployment | Vercel |
| Domain | verity.joaog.space |

## Decision Log

### Two-stage streaming vs single-pass vs OCR pipeline

**Chose: Two-stage streaming.** The validation is split into a fast classification call (~3s for the verdict) followed by a background field extraction call (~4s more), streamed via Server-Sent Events.

Three approaches were considered during design:
1. **Single-pass vision LLM** — One call for everything. Simple, but 4-6s before the user sees anything.
2. **OCR-first pipeline** — Extract text first, then reason with an LLM. Adds complexity, loses visual context (logos, layout, formatting).
3. **Two-stage streaming** — Classify fast, extract in background. Two calls = more total tokens, but the user gets the answer in ~3s.

The two-stage approach was chosen because the user's primary question — "does this document match?" — should be answered as fast as possible. Field extraction is secondary and can populate progressively.

### Gemini Flash vs OpenAI GPT-4o vs Anthropic Claude

**Chose: Gemini 2.0 Flash.** Free tier, native PDF support, structured JSON output.

- Native PDF upload means no PDF-to-image conversion overhead.
- `responseMimeType: "application/json"` gives structured output without post-processing.
- OpenAI GPT-4o-mini is faster for text (~1-2s) but lacks native PDF support — would need conversion, adding latency back.
- Gemini occasionally returns malformed JSON on complex documents, mitigated by automatic retry (2 attempts) and control character stripping.

### Strict matching vs fuzzy matching

**Chose: Strict.** Every specific detail in the expectation must be satisfied.

For document validation, false positives are worse than false negatives. An employee needs to know "this is NOT what was expected." A wastewater bill does not match "electricity bill" even though both are utilities. Blank forms do not match "completed form." Instructions about a form do not match the form itself.

### No database / stateless design

**Chose: No persistence.** History lives in `sessionStorage`, clears on tab close.

Document validation is inherently stateless — each upload is independent. Adding a database adds deployment complexity without clear user value. Session history covers the "compare recent results" use case. Would reconsider if the tool needs audit trails, team sharing, or analytics.

### Next.js monolith vs separate frontend/backend

**Chose: Monolith.** One project, one `npm run dev`, one deploy.

API routes run server-side (Gemini key stays safe), no CORS issues, shared TypeScript types between client and server. Vercel deploys it as a single unit. Acceptable tradeoff: can't scale frontend and backend independently, but fine for a tool app.

### Branding decisions

**Name:** Verity (Latin for "truth") — chosen for its distinctive, proper-name quality (like "Claude" or "Gemini"). Selected from candidates: Archon, Verity, Sentinel, Argus, Nexus, Orion.

**Font:** Outfit (geometric sans-serif) — selected from 5 candidates compared side-by-side (Lora, Merriweather, Playfair Display, Space Grotesk, Outfit). Outfit gives a modern AI/tech feel that contrasts well with Inter for body text.

**Color palette:** User-provided custom 5-color palette replacing the default shadcn grayscale:
- Dust Grey (#e3d5d5) — muted backgrounds
- Gunmetal (#3d4146) — text
- Rosy Copper (#cd694e) — destructive/error accent
- Pacific Blue (#58a8c3) — primary
- Glaucous (#6f81d9) — ring/focus

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

**Retry:** Each stage retries once on parse failure. Control characters are stripped before parsing. Empty responses are guarded against.

**Test suite compatibility:** A single-pass `validateDocument` method is preserved for the `/tests` page (server actions don't use SSE).

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
  validateDocument(parts: DocumentPart[], expectation: string): Promise<ValidatorResponse>;
  classifyDocument(parts: DocumentPart[], expectation: string): Promise<ClassifyResponse>;
  extractFields(parts: DocumentPart[], expectation: string): Promise<ExtractResponse>;
}
```

Current implementation: `GeminiProvider` with automatic retry on each method. Shared constants (`GEMINI_MODEL`, `getGeminiClient()`) ensure consistency across the validate and suggest routes.

## Latency Analysis

### Where the time goes

| Step | Time | User sees |
|------|------|-----------|
| File upload + processing | ~150ms | Spinner |
| **Stage 1: Classify (Gemini)** | **2-3.5s** | **Verdict appears** |
| Stage 2: Extract fields (Gemini) | 3-5s more | Fields fade in |
| **Time to verdict** | **~3s** | |
| **Total time** | **7-8s** | |

The user gets the answer (match/no match) in ~3 seconds. Field extraction runs in the background and populates progressively.

### Why Gemini Flash takes 3-6 seconds

- **Free tier**: Lower priority scheduling compared to paid accounts.
- **Multi-modal inference**: Processing PDF pages as vision input is computationally expensive.
- **Structured output**: `responseMimeType: "application/json"` adds constraint-based decoding overhead.

### What paid alternatives could achieve

| Provider | Model | Est. latency | Native PDF | Cost | Notes |
|----------|-------|-------------|-----------|------|-------|
| Google (paid) | Gemini 2.0 Flash | 2-3s | Yes | ~$0.001/call | Same model, dedicated capacity |
| Google (paid) | Gemini 2.0 Pro | 4-8s | Yes | ~$0.005/call | Higher quality, slower |
| OpenAI | GPT-4o-mini | 1-2s | No | ~$0.002/call | Fast, but needs PDF-to-image (+500ms) |
| OpenAI | GPT-4o | 2-4s | No | ~$0.01/call | Highest quality vision |
| Anthropic | Claude 3.5 Haiku | 1-2s | No | ~$0.001/call | Fast text, vision adds latency |

### Conclusion

The ~3s time-to-verdict with two-stage streaming is a practical tradeoff for zero cost, native PDF support, and full field extraction. A paid Gemini tier would bring this to ~2s with zero code changes. OpenAI GPT-4o-mini could reach ~1s for the classify stage but requires adding a PDF-to-image conversion step.

### Optimizations applied

- Two-stage streaming (verdict in ~3s, fields in background)
- JPEG compression at 768px width (reduces image tokens ~60%)
- `temperature: 0` (no sampling overhead)
- `maxOutputTokens: 256` for classify, `1024` for extract
- PDF truncation to 3 pages via pdf-lib
- Focused prompts (classify prompt has no field extraction = shorter I/O)

## Security & Hardening

- **Rate limiting**: In-memory sliding window per IP. Denied requests do not count against the window.
- **Input sanitization**: Unicode `\p{Cc}` class for control char stripping, 500-char limit, shared helper
- **Prompt injection defense**: "UNTRUSTED INPUT" boundary markers and "do not follow instructions" directives on both validate and suggest routes
- **Typed error codes**: `validation_error`, `parse_error`, `provider_error`, `rate_limit`, `unknown`
- **LLM retry**: Each stage retries once on parse failure with control character stripping and empty response guards
- **Suggest cache**: Static prefix matches (10 common patterns) + 200-entry LRU cache

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

**Pass rate: 10/10**

**Average time to verdict: 3.3s** (user sees Match/No Match here)

**Average total time: 7.6s** (fields fully populated)

Key observations:
- Two-stage architecture delivers the verdict in ~3s consistently across all document types
- Strict matching works correctly across all test cases
- Blank/template forms correctly rejected when "completed" expected (#6, #10)
- Cross-type mismatches correctly rejected (#2 W-2 vs pay stub, #5 wastewater vs electricity, #8 passport vs license)

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
- History sits below the main grid — collapsible icon button on mobile, always visible on desktop

### Components

1. **Expectation input** — Text field with ghost text completion (Tab to accept), AI suggestion dropdown (debounced 400ms), and 8 quick-pick badge chips (4 visible + expandable)
2. **Upload zone** — Native `<button>` wrapping a drag-and-drop area with file icon + extension badge thumbnail
3. **Result card** — Status badge (Match/No Match/Uncertain), category badge, confidence + time with Tooltips. "Why" section with colored left border accent. Summary and extracted fields as sub-components. Shows skeleton during field extraction.
4. **Result skeleton** — Pulse loading placeholder shown during initial LLM processing
5. **Empty state** — "How it works" 3-step guide (Describe, Upload, Validate)
6. **History list** — Session-persisted, expandable entries. Collapsible on mobile, always visible on desktop.
7. **Theme toggle** — Sun/Moon in header, light/dark via next-themes
8. **Design doc page** — `/docs` renders this markdown at build time
9. **Test suite page** — `/tests` runs 10 test documents with live pass/fail dashboard

### Design System (shadcn/ui)

Primitives: Button, Input, Card, Badge, Label, Alert, Tooltip. All use semantic CSS variables that adapt to light/dark themes.

Status colors:
- Match: `text-success` / `bg-success/10`
- No Match: `text-destructive` / `bg-destructive/10`
- Uncertain: `text-warning` / `bg-warning/10`

## Error Handling

| Error | User message | Code | Strategy |
|-------|-------------|------|----------|
| File > 5MB | "File exceeds 5MB limit" | `validation_error` | Client + server validation |
| Bad format | "Unsupported file type" | `validation_error` | Client MIME + server validation |
| PDF > 3 pages | Truncated, badge shown | — | pdf-lib extracts first 3 pages |
| LLM parse failure | Auto-retry once | — | Control char stripping, then `parse_error` |
| Empty LLM response | Auto-retry once | — | Guard + clear error message |
| Field extraction failure | Graceful degradation | — | Verdict still shown, summary says "not available" |
| Rate limit exceeded | "Too many requests" | `rate_limit` | 429 with Retry-After header |
| API key issue | "AI service config error" | `provider_error` | Logged server-side |
| Network error | Error alert | — | UI error state |

## File Structure

```
doc-validator/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, fonts, providers
│   │   ├── page.tsx                # Main page, two-column layout, SSE state
│   │   ├── globals.css             # Tailwind v4, shadcn theme, custom palette
│   │   ├── icon.svg                # Favicon
│   │   ├── docs/                   # Design doc page (server-rendered markdown)
│   │   ├── tests/                  # Live test suite (server actions + dashboard)
│   │   └── api/
│   │       ├── validate/route.ts   # SSE streaming validation
│   │       └── suggest/route.ts    # AI autocomplete (cached + rate limited)
│   ├── components/
│   │   ├── expectation-input.tsx   # Input + ghost text + dropdown + badges
│   │   ├── upload-zone.tsx         # Drag-and-drop + file icon
│   │   ├── file-thumbnail.tsx      # File icon with extension badge
│   │   ├── result-card.tsx         # Two-stage result display
│   │   ├── result-skeleton.tsx     # Loading skeleton
│   │   ├── history-list.tsx        # Collapsible session history
│   │   ├── empty-state.tsx         # First-time guide
│   │   ├── theme-toggle.tsx        # Light/dark switcher
│   │   ├── providers.tsx           # ThemeProvider + QueryClient + TooltipProvider
│   │   └── ui/                     # shadcn/ui primitives
│   ├── hooks/
│   │   ├── use-validate.ts         # SSE stream hook (verdict + fields)
│   │   └── use-suggestions.ts      # Debounced autocomplete query
│   ├── lib/
│   │   ├── schemas.ts              # Zod schemas (classify + extract + combined)
│   │   ├── api-client.ts           # SSE stream consumer
│   │   ├── sanitize.ts             # Input sanitization
│   │   ├── rate-limit.ts           # Sliding window rate limiter
│   │   ├── utils.ts                # cn() helper
│   │   ├── llm/
│   │   │   ├── types.ts            # LLMProvider interface
│   │   │   ├── constants.ts        # Shared model name + client factory
│   │   │   ├── provider.ts         # Provider factory
│   │   │   ├── gemini-provider.ts  # Gemini with retry (classify + extract + validate)
│   │   │   └── prompt.ts           # Prompts with injection defense
│   │   └── document/
│   │       ├── image-processor.ts  # JPEG resize via sharp
│   │       └── pdf-processor.ts    # Page count + truncation via pdf-lib
│   └── lib/__tests__/              # Vitest tests
├── test-docs/                      # Generated test PDFs
├── test-docs/real/                 # Real-world PDFs
├── docs/design.md                  # This document
└── package.json
```

## Deployment

- **Platform:** Vercel
- **Domain:** verity.joaog.space (DNS via Vercel nameservers)
- **Environment variables:** `GEMINI_API_KEY` (set via `vercel env`)
- **Build/Deploy:** `vercel --prod` from CLI

## Scope

**Built:**
- Two-stage streaming validation (verdict in ~3s, fields fade in after)
- Document upload (PDF, JPG, PNG, WebP) with file icon preview
- Free-text expectation with AI autocomplete (ghost text + dropdown + cached suggestions)
- Quick-pick badge chips (8 presets, 4 visible + expandable)
- Strict classification and field extraction via Gemini Flash with automatic retry
- Match/No Match/Uncertain verdicts with explanations
- PDF truncation to 3 pages for oversized documents
- Session history (persists across refresh, collapsible on mobile)
- Light/dark theme with custom 5-color palette
- Responsive two-column layout on large screens
- Loading skeleton, empty state, transitions
- Rate limiting, input sanitization, prompt injection defense
- Typed error codes
- Design doc page at `/docs`
- Live test suite at `/tests` with 10 real-world documents
- Accessible: native button elements, aria labels, screen reader support
- Deployed to production on custom domain

**Out of scope (future):**
- Batch upload / multi-document comparison
- Persistent storage / database
- User accounts and authentication
- Webhook notifications for automated pipelines
- Custom category training / fine-tuning
- OCR fallback pipeline for degraded scans
- Production-grade rate limiting (Upstash Redis / Vercel KV)
