# Verity — Design Document

## Goal

A web application for employees validating customer-submitted documents. Upload a document (PDF, image, or scan), describe what you expect it to be in free text, and get back within 5 seconds: the document category, confidence score, extracted fields, a summary, and a strict match verdict.

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
| PDF page detection | Regex-based `/Type /Page` counter (zero dependencies) |
| PDF thumbnail | `pdfjs-dist` (client-side, first page rendered to canvas) |
| Schema validation | Zod (LLM response parsing) |
| Theming | `next-themes` (light default, dark mode toggle) |
| Deployment | Vercel |
| Domain | verity.joaog.space |

## Approach: Single-Pass Vision LLM

Send the document directly to Gemini 2.0 Flash in one API call with a structured prompt. PDFs are sent as `application/pdf` (Gemini handles natively). Images are resized to 768px width JPEG before sending (fewer tokens = faster).

The prompt enforces **strict expectation matching**: every specific detail in the user's expectation must be satisfied. "Electricity bill" will not match a wastewater bill, even though both are utilities.

**Generation config:** `temperature: 0`, `maxOutputTokens: 1024`, `responseMimeType: "application/json"` for fast, deterministic structured output.

## API Endpoints

### `POST /api/validate`

Main validation endpoint. Accepts multipart form data.

**Request:** `file` (binary) + `expectation` (string)

**Response:**
```typescript
type ValidatorResponse = {
  category: string;            // e.g. "utility_bill"
  categoryLabel: string;       // e.g. "Utility Bill"
  confidence: number;          // 0.0 - 1.0
  matchesExpectation: boolean;
  matchExplanation: string;
  extractedFields: Record<string, string>;
  summary: string;
  processingTimeMs: number;
  truncated: boolean;
}
```

### `GET /api/suggest?q=<partial_text>`

AI-powered autocomplete. Returns 4 document expectation suggestions based on partial user input. Debounced at 400ms on the client, cached for 60s per prefix.

**Response:** `string[]` (4 suggestions)

Minimum query length: 3 characters. Uses `temperature: 0.5` for diverse but relevant completions. Prompt is framed for employees validating customer-submitted documents.

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

Current implementation: `GeminiProvider`. The adapter interface allows swapping to OpenAI or Anthropic without touching the API route.

**Response normalization:** The provider flattens nested `extractedFields` objects to `Record<string, string>` and unwraps array responses from the LLM.

## Performance

| Step | Measured |
|------|----------|
| Image resize (JPEG 768px) | ~50ms |
| PDF page count (regex) | ~1ms |
| LLM call (Gemini Flash) | 3-5s |
| Response parsing | ~5ms |
| **Typical total** | **4-6s** |

Optimizations applied: shorter prompt, JPEG compression, temperature=0, maxOutputTokens cap.

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

1. **Expectation input** — Text field with AI-powered ghost text completion (Tab to accept), dropdown with 4 AI suggestions (debounced), and 8 quick-pick badge chips (4 visible + expandable)
2. **Upload zone** — Drag-and-drop area with file preview thumbnail (PDF first-page rendering via pdfjs-dist, images via object URL)
3. **Result card** — Status badge (Match/No Match/Uncertain), category badge, confidence + time with tooltips. "Why" section with colored left border accent. Summary in muted background. Stacked label-over-value extracted fields. Fade-in + slide-up animation.
4. **Result skeleton** — Pulse loading placeholder matching result card layout, shown during LLM processing
5. **Empty state** — "How it works" 3-step guide (Describe, Upload, Validate) shown before first validation
6. **History list** — Session-based, entries are expandable (click to show full result card inline, click again to collapse)
7. **Theme toggle** — Sun/Moon icon in header, switches between light and dark themes via next-themes
8. **Badge hover** — All badges scale up 5% on hover with transition

### Design System (shadcn/ui)

Primitives: Button, Input, Card, Badge, Label, Alert, Tooltip. All use semantic CSS variables (`bg-background`, `text-foreground`, `text-primary`, `text-destructive`, `text-success`, `text-warning`) that adapt to light/dark themes.

Status colors use semantic tokens:
- Match: `text-success` / `bg-success/10`
- No Match: `text-destructive` / `bg-destructive/10`
- Uncertain: `text-warning` / `bg-warning/10`

## Error Handling

| Error | User message | Strategy |
|-------|-------------|----------|
| File > 10MB | "File exceeds 10MB limit" | Client-side check |
| Bad format | "Please upload a PDF, JPG, PNG, or WebP" | Client MIME + server validation |
| PDF > 3 pages | "Only the first 3 pages will be analyzed" | Warning badge on result |
| LLM timeout | "An unexpected error occurred. Please try again." | Auto-retry once (React Query) |
| Malformed LLM JSON | "Failed to parse AI response." | Zod validation + array unwrapping |
| Missing API key | Throws on server startup | `GEMINI_API_KEY` env var required |
| Network error | Error alert with message | React Query error state |

## File Structure

```
doc-validator/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, fonts (Inter + Outfit), providers
│   │   ├── page.tsx                # Main page, two-column layout, state management
│   │   ├── globals.css             # Tailwind v4, shadcn theme, custom palette
│   │   ├── icon.svg                # Favicon (Pacific Blue "V")
│   │   └── api/
│   │       ├── validate/route.ts   # Document validation endpoint
│   │       └── suggest/route.ts    # AI autocomplete endpoint
│   ├── components/
│   │   ├── expectation-input.tsx   # Input + ghost text + dropdown + badges
│   │   ├── upload-zone.tsx         # Drag-and-drop + file preview thumbnail
│   │   ├── file-thumbnail.tsx      # PDF/image thumbnail renderer
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
│   │   ├── api-client.ts           # Frontend fetch wrapper
│   │   ├── utils.ts                # cn() helper (tailwind-merge + clsx)
│   │   ├── llm/
│   │   │   ├── types.ts            # LLMProvider + DocumentPart interfaces
│   │   │   ├── provider.ts         # Provider factory (singleton)
│   │   │   ├── gemini-provider.ts  # Gemini 2.0 Flash implementation
│   │   │   └── prompt.ts           # Strict validation prompt builder
│   │   └── document/
│   │       ├── image-processor.ts  # Resize to 768px JPEG via sharp
│   │       └── pdf-processor.ts    # Regex page counter
│   └── lib/__tests__/              # Vitest tests (schemas, prompt, image processor)
├── test-docs/                      # 9 test PDFs (bills, invoices, lease, lab report, etc.)
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

## Scope Boundaries

**Built (v1):**
- Single document upload with preview thumbnail
- Free-text expectation with AI autocomplete (ghost text + dropdown)
- Quick-pick suggestion badges
- Strict classification and field extraction via Gemini Flash
- Match/No Match/Uncertain verdicts with explanations
- Expandable session history
- Light/dark theme with custom palette
- Responsive two-column layout on large screens
- Loading skeleton, empty state, transitions
- Deployed to production on custom domain

**Out of scope (future):**
- Batch upload / multi-document comparison
- Persistent storage / database
- User accounts and authentication
- Webhook notifications
- Custom category training
- OCR fallback pipeline for degraded scans
- Batch API for programmatic access
