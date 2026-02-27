export function buildPrompt(expectation: string): string {
  return `Analyze this document. The user expects: "${expectation}"

Return a single JSON object (not an array) with these keys:
- category: snake_case string (e.g. "utility_bill", "invoice", "bank_statement")
- categoryLabel: human-readable string
- confidence: number 0.0–1.0
- matchesExpectation: boolean
- matchExplanation: brief string
- extractedFields: flat object of string keys to string values, e.g. {"invoice_number": "INV-123", "date": "2024-01-15", "total": "$93.50"}. Do NOT nest objects inside extractedFields.
- summary: 1-2 sentence string

Copy field values exactly as shown. Use "illegible" for unreadable values.`;
}
