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
              text: `Complete this document description into 4 different specific document expectations a user might type when uploading a document for validation. The user has typed so far: "${q}"

Return a JSON array of exactly 4 strings. Each should be a complete, specific document description (10-20 words). Make them diverse.

Example: if the user typed "A recent", return:
["A recent electricity bill from the last 3 months","A recent bank statement showing account activity","A recent medical prescription or lab report","A recent pay stub or salary statement"]`,
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
