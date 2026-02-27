import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  client = new GoogleGenAI({ apiKey });
  return client;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 3) {
    return NextResponse.json([]);
  }

  try {
    const ai = getClient();

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are helping an employee who validates documents submitted by customers. They are typing what document they expect to receive. Complete their partial input into 4 specific document descriptions.

The employee has typed so far: "${q}"

Return a JSON array of exactly 4 strings. Each should be a complete, specific expectation an employee would set when checking a submitted document (8-15 words). Focus on document types commonly submitted for verification: utility bills, bank statements, IDs, contracts, tax forms, medical records, insurance documents, pay stubs, etc.

Example: if typed "A recent", return:
["A recent utility bill showing the customer's current address","A recent bank statement from within the last 90 days","A recent pay stub confirming employment and salary","A recent medical lab report with patient details"]`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
        maxOutputTokens: 256,
      },
    });

    const text = response.text ?? "[]";
    let parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) parsed = [];
    const suggestions = parsed
      .filter((s: unknown): s is string => typeof s === "string")
      .slice(0, 4);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Suggest error:", error);
    return NextResponse.json([]);
  }
}
