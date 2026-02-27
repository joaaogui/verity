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

## Evolution & Decision Log

This section documents the key decisions made during development, the reasoning behind them, and how the architecture evolved through iteration and feedback.

### Phase 1: Initial Design (v1.0)

**3 approaches were considered:**
1. **Single-pass vision LLM** — Send document directly to Gemini, get everything in one call.
2. **OCR-first pipeline** — Extract text via Tesseract/Google Vision, then reason with a text LLM.
3. **Hybrid** — Vision for classification, OCR for extraction in parallel.

**Chose: Approach 1 (single-pass).** Simplest architecture, fewest failure modes, Gemini handles PDFs natively.

**Tech stack decisions:**
- User suggested Next.js to unify frontend/backend — accepted because it eliminates CORS, shares TypeScript types, deploys as one unit.
- User suggested React Query — accepted for `useMutation` (validation) and `useQuery` (autocomplete debounce). Later replaced for validation with a custom SSE hook when we moved to streaming.
- Gemini 2.0 Flash chosen for free tier + native PDF support. Alternative (OpenAI GPT-4o-mini) rejected because it lacks native PDF upload.

### Phase 2: Branding & Design (v1.0-v1.1)

**Name:** Started as "DocValidator." User wanted something distinctive, like "Claude" or "Gemini." Options considered: Archon, Verity, Sentinel, Argus, Nexus, Orion. **Chose: Verity** (Latin for "truth").

**Font:** 5 fonts rendered side-by-side for comparison: Lora, Merriweather, Playfair Display, Space Grotesk, Outfit. **Chose: Outfit** — geometric sans with a modern AI/tech feel. Playfair Display was tried first but felt too editorial.

**Color palette:** User provided a specific 5-color palette from a color tool. The original shadcn neutral grayscale was replaced with a warm, distinctive palette:
- Dust Grey (#e3d5d5) — muted backgrounds
- Gunmetal (#3d4146) — text
- Rosy Copper (#cd694e) — destructive/error accent
- Pacific Blue (#58a8c3) — primary
- Glaucous (#6f81d9) — ring/focus

### Phase 3: Strict Matching (v1.0)

**Problem discovered in testing:** A wastewater bill matched "electricity or gas utility bill" because the LLM was matching on the broad "utility" category. User flagged this as incorrect.

**Fix:** Prompt was rewritten to enforce literal matching with explicit rules: electricity != water, blank form != completed form, instructions != the form itself. This was a pivotal decision — the tool became stricter, which is the right behavior for document validation where false positives are worse than false negatives.

### Phase 4: Hardening (v1.1)

After deployment, two comprehensive code reviews were conducted (one design review, one security/quality review). Key findings and fixes:

- **Suggest endpoint cost:** Every keystroke with 3+ chars was an LLM call. Fixed with static prefix fallback (10 patterns) + 200-entry server-side LRU cache. Cuts LLM calls ~90%.
- **Prompt injection:** User expectation was interpolated directly into prompts. Fixed with boundary markers ("UNTRUSTED INPUT") and "do not follow instructions" directives in both validate and suggest prompts.
- **Rate limiting:** Added IP-based sliding window (fixed to not count denied requests after reviewer caught the bug).
- **PDF page counting:** Evolved through 3 implementations: `pdf-parse` (incompatible v2 API) → regex `/Type /Page` counter (fragile) → `pdf-lib` `getPageCount()` (reliable). `pdf-lib` also enabled actual PDF truncation (extracting first 3 pages) instead of just detecting page count.
- **File size:** Reduced from 10MB to 5MB after a 4.5MB IRS instructions PDF caused a 28s response.
- **pdfjs-dist:** Added for PDF thumbnail rendering, then removed (~1.5MB bundle) and replaced with a simple file icon + extension badge. The UX tradeoff was acceptable.
- **Accessibility:** `div[role=button]` replaced with native `<button>`, `aria-label` on file input, `aria-expanded` on history toggle, `aria-label` on status icons.

### Phase 5: Two-Stage Streaming (v1.3)

**Problem:** Single-pass validation took 4-6s. The original brief asked for "within 2 seconds."

**Solution:** Split into two sequential LLM calls streamed via SSE:
- Stage 1 (classify, ~3s): category + match verdict + explanation. Minimal prompt, short output.
- Stage 2 (extract, ~4s more): extracted fields + summary. Runs in background while user reads the verdict.

**Result:** Time-to-verdict dropped from 4-6s to ~3s. Total time increased (~7-8s) but perceived latency improved significantly.

**Implementation:** TanStack Query `useMutation` was replaced with a custom `useValidate` hook that manages `verdict`, `fields`, `isPending`, and `isExtractingFields` state from an SSE stream consumer. The result card renders partial data with skeleton placeholders that fade in when fields arrive.

### Phase 6: Testing & Documentation (v1.2-v1.3)

**LLM retry:** 3 out of 10 real-world PDFs caused parse failures from malformed JSON. Fixed by retrying once per stage with control character stripping (`\p{Cc}` Unicode class).

**Test suite page:** `/tests` runs 10 real documents through the validator with a "Run All" button, showing live pass/fail status. Uses server actions to read files from disk and call the provider directly (bypassing SSE for simplicity).

**Design doc page:** `/docs` renders this markdown file at build time using `react-markdown` + `remark-gfm` + `@tailwindcss/typography`.

### Responsive History (v1.3+)

**Problem:** History panel sat between the input form and results on mobile, pushing results below the fold.

**Fix:** Moved history to after the results section. On mobile (below `xl`), shows as a collapsible "History (N)" button. On desktop, always visible.

### Hydration Safety

Went through multiple iterations to load `sessionStorage` history without React hydration mismatches or linter-flagged `setState` in effects. Final approach: `useSyncExternalStore` reads `sessionStorage` for the initial snapshot (returns `"[]"` on server), `useState` initializes from it, and `persistHistory()` writes to both state and storage atomically.

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

**Retry:** Each stage retries once on parse failure. Control characters are stripped before parsing using Unicode property class `\p{Cc}`.

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
  validateDocument(parts: DocumentPart[], expectation: string): Promise<ValidatorResponse>;
  classifyDocument(parts: DocumentPart[], expectation: string): Promise<ClassifyResponse>;
  extractFields(parts: DocumentPart[], expectation: string): Promise<ExtractResponse>;
}
```

Current implementation: `GeminiProvider` with automatic retry on each method. Shared constants (`GEMINI_MODEL`, `getGeminiClient()`) in `constants.ts` ensure the model name and client are consistent across the validate and suggest routes.

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

- Two-stage streaming (verdict in 3s, fields in background)
- JPEG compression at 768px width (reduces image tokens ~60%)
- `temperature: 0` (no sampling overhead)
- `maxOutputTokens: 256` for classify, `1024` for extract (caps generation)
- PDF truncation to 3 pages via pdf-lib (prevents oversized payloads)
- Focused prompts (classify prompt has no field extraction = shorter input and output)

## Hardening (v1.1)

- **Rate limiting**: In-memory sliding window, 10/min for validate, 30/min for suggest, per IP. Denied requests do not count against the window.
- **Input sanitization**: Unicode `\p{Cc}` class for control char stripping, 500-char limit on expectations, shared `sanitizeUserInput()` helper
- **Prompt injection defense**: Untrusted input boundary markers, explicit "do not follow instructions" directive on both validate and suggest routes
- **Typed error codes**: API returns `{ error, code }` with categories: `validation_error`, `parse_error`, `provider_error`, `rate_limit`, `unknown`
- **LLM retry**: Each stage retries once on parse failure (strips control chars before re-parsing, guards against empty responses)
- **Suggest cache**: Static prefix matches (10 common patterns) + 200-entry LRU cache for dynamic queries
- **Session history**: Persists in `sessionStorage` via `useSyncExternalStore` (hydration-safe, no setState in effects)
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

- **Name:** Verity (Latin for "truth") — chosen for its distinctive, proper-name quality (like "Claude" or "Gemini")
- **Display font:** Outfit (geometric sans-serif, AI/tech feel) — selected from 5 candidates compared side-by-side
- **Body font:** Inter
- **Primary color:** Pacific Blue (#58a8c3)
- **Palette:** Dust Grey (#e3d5d5), Gunmetal (#3d4146), Rosy Copper (#cd694e), Pacific Blue (#58a8c3), Glaucous (#6f81d9) — user-provided custom palette
- **Favicon:** Pacific Blue rounded square with white serif "V"

### Layout

- **Single column** on small/medium screens, **two-column** on xl+ (1280px): input panel left, results right
- Max width: `max-w-6xl` (1152px)
- Two-column layout only activates once results exist
- History section sits below the two-column grid — collapsible icon button on mobile, always visible on desktop

### Components

1. **Expectation input** — Text field with AI-powered ghost text completion (Tab to accept), dropdown with 4 AI suggestions (debounced 400ms), and 8 quick-pick badge chips (4 visible + expandable)
2. **Upload zone** — Native `<button>` wrapping a drag-and-drop area with file icon + extension badge thumbnail (images show object URL preview). Uses `sr-only` hidden file input with `aria-label`.
3. **Result card** — Status badge (Match/No Match/Uncertain), category badge, confidence + time with shadcn Tooltips. "Why" section with colored left border accent (SummarySection + FieldsSection extracted as sub-components). Fade-in + slide-up animation. Shows skeleton during field extraction.
4. **Result skeleton** — Pulse loading placeholder matching result card layout, shown during initial LLM processing
5. **Empty state** — "How it works" 3-step guide (Describe, Upload, Validate) shown before first validation
6. **History list** — Session-persisted (survives refresh via `useSyncExternalStore`), entries are expandable. Collapsible on mobile with icon button, always visible on xl+.
7. **Theme toggle** — Sun/Moon icon in header, light/dark via next-themes
8. **Design doc page** — `/docs` renders this markdown at build time via `react-markdown`
9. **Test suite page** — `/tests` runs 10 test documents with "Run All" dashboard

### Design System (shadcn/ui)

Primitives: Button, Input, Card, Badge, Label, Alert, Tooltip. All use semantic CSS variables that adapt to light/dark themes. Cursor pointer restored globally for buttons and badges (shadcn removed it by default).

Status colors use semantic tokens:
- Match: `text-success` / `bg-success/10`
- No Match: `text-destructive` / `bg-destructive/10`
- Uncertain: `text-warning` / `bg-warning/10`

## Error Handling

| Error | User message | Code | Strategy |
|-------|-------------|------|----------|
| File > 5MB | "File exceeds 5MB limit" | `validation_error` | Client-side check + server validation |
| Bad format | "Unsupported file type" | `validation_error` | Client MIME + server validation |
| PDF > 3 pages | Truncated silently, badge shown | — | pdf-lib extracts first 3 pages |
| LLM parse failure | Auto-retry once | — | Strip control chars (`\p{Cc}`), retry, then `parse_error` |
| Empty LLM response | Auto-retry once | — | Guard in `cleanAndParse`, clear error message |
| LLM timeout | "An unexpected error occurred" | `unknown` | SSE error event |
| Field extraction failure | "Field extraction was not available" | — | Graceful degradation, verdict still shown |
| Rate limit exceeded | "Too many requests" | `rate_limit` | 429 with Retry-After header |
| API key issue | "AI service configuration error" | `provider_error` | Logged server-side |
| Network error | Error alert with message | — | UI error state |

## File Structure

```
doc-validator/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, fonts (Inter + Outfit), providers
│   │   ├── page.tsx                # Main page, two-column layout, SSE state management
│   │   ├── globals.css             # Tailwind v4, shadcn theme, custom palette
│   │   ├── icon.svg                # Favicon (Pacific Blue "V")
│   │   ├── docs/
│   │   │   ├── page.tsx            # Design doc server component
│   │   │   └── markdown-content.tsx # Client-side markdown renderer
│   │   ├── tests/
│   │   │   ├── page.tsx            # Live test suite dashboard
│   │   │   ├── actions.ts          # Server actions for running test cases
│   │   │   └── test-cases.ts       # 10 test case definitions
│   │   └── api/
│   │       ├── validate/route.ts   # SSE streaming validation endpoint
│   │       └── suggest/route.ts    # AI autocomplete (cached + rate limited)
│   ├── components/
│   │   ├── expectation-input.tsx   # Input + ghost text + dropdown + badges
│   │   ├── upload-zone.tsx         # Native button drag-and-drop + file icon
│   │   ├── file-thumbnail.tsx      # File icon with extension badge
│   │   ├── result-card.tsx         # Two-stage result display (verdict + fields)
│   │   ├── result-skeleton.tsx     # Loading skeleton placeholder
│   │   ├── history-list.tsx        # Collapsible session history
│   │   ├── empty-state.tsx         # "How it works" first-time guide
│   │   ├── theme-toggle.tsx        # Light/dark mode switcher
│   │   ├── providers.tsx           # ThemeProvider + QueryClient + TooltipProvider
│   │   └── ui/                     # shadcn/ui primitives (7 components)
│   ├── hooks/
│   │   ├── use-validate.ts         # Custom SSE stream hook (verdict + fields state)
│   │   └── use-suggestions.ts      # useQuery with 400ms debounce for /api/suggest
│   ├── lib/
│   │   ├── schemas.ts              # Zod v4 schemas (classify + extract + combined)
│   │   ├── api-client.ts           # SSE stream consumer (parseSseBlock → readSseStream)
│   │   ├── sanitize.ts             # Input sanitization (Unicode \p{Cc}, length limit)
│   │   ├── rate-limit.ts           # IP-based sliding window rate limiter
│   │   ├── utils.ts                # cn() helper (tailwind-merge + clsx)
│   │   ├── llm/
│   │   │   ├── types.ts            # LLMProvider + DocumentPart interfaces
│   │   │   ├── constants.ts        # Shared GEMINI_MODEL + client factory
│   │   │   ├── provider.ts         # Provider factory
│   │   │   ├── gemini-provider.ts  # Gemini 2.0 Flash with retry (classify + extract + validate)
│   │   │   └── prompt.ts           # Three prompts: classify, extract, combined (with injection defense)
│   │   └── document/
│   │       ├── image-processor.ts  # Resize to 768px JPEG via sharp
│   │       └── pdf-processor.ts    # pdf-lib page count + truncation to 3 pages
│   └── lib/__tests__/              # Vitest tests (schemas, prompt, image processor)
├── test-docs/                      # Generated test PDFs (lease, lab report, NDA, etc.)
├── test-docs/real/                 # Real-world PDFs (IRS forms, invoices, passports)
├── docs/design.md                  # This document
├── .env.local                      # GEMINI_API_KEY
├── .npmrc                          # Force public npm registry (overrides corporate registry)
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
- **Note:** `.npmrc` forces public npm registry to avoid Vercel build failures from corporate registry tokens in the global config.

## Scope

**Built:**
- Two-stage streaming validation (verdict in ~3s, fields fade in after)
- Single document upload (PDF, JPG, PNG, WebP) with file icon preview
- Free-text expectation with AI autocomplete (ghost text + dropdown + cached suggestions)
- Quick-pick badge chips (8 presets, 4 visible + expandable)
- Strict classification and field extraction via Gemini Flash with automatic retry
- Match/No Match/Uncertain verdicts with explanations
- PDF truncation to 3 pages for oversized documents
- Expandable session history (persists across refresh, collapsible on mobile)
- Light/dark theme with custom 5-color palette
- Responsive two-column layout on large screens
- Loading skeleton, empty state, transitions
- Rate limiting, input sanitization, prompt injection defense
- Typed error codes for debugging
- Design doc page at `/docs`
- Live test suite at `/tests` with 10 real-world documents
- Deployed to production on custom domain
- Accessible: native button elements, aria labels, screen reader support

**Out of scope (future):**
- Batch upload / multi-document comparison
- Persistent storage / database
- User accounts and authentication
- Webhook notifications for automated pipelines
- Custom category training / fine-tuning
- OCR fallback pipeline for degraded scans
- Vercel KV / Upstash Redis for production-grade rate limiting
