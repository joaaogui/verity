export function buildPrompt(expectation: string): string {
  return `You are a document analysis expert. Analyze the uploaded document image(s) and provide a structured assessment.

The user expects this document to be: "${expectation}"

Analyze the document and respond with a JSON object containing exactly these fields:

{
  "category": "snake_case category identifier (e.g. utility_bill, bank_statement, passport, contract, invoice, medical_prescription, lab_result, drivers_license, tax_form, pay_stub, insurance_card, lease_agreement, nda, receipt, other)",
  "categoryLabel": "Human-readable category name (e.g. Utility Bill, Bank Statement)",
  "confidence": 0.0 to 1.0 confidence in the classification,
  "matchesExpectation": true or false - does this document match what the user expected?,
  "matchExplanation": "Brief explanation of why it matches or doesn't match the user's expectation",
  "extractedFields": { "key": "value" pairs of important fields found in the document (dates, amounts, names, account numbers, addresses, etc.) },
  "summary": "2-3 sentence summary of what this document is and its key details"
}

Important rules:
- Extract ALL visible relevant fields from the document
- Be precise with extracted values (copy exactly as shown)
- If you cannot read something clearly, note it as "illegible" in the field value
- Confidence should reflect how certain you are about the category
- matchesExpectation should be based on comparing the actual document against the user's stated expectation
- Respond ONLY with the JSON object, no markdown fences or extra text`;
}
