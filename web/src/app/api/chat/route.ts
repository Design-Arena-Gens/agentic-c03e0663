import { NextRequest, NextResponse } from "next/server";

type ChatRole = "system" | "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

const DEFAULT_OLLAMA_URL = "http://localhost:11434/api/chat";
const DEFAULT_MODEL = "tinyllama";

const OLLAMA_URL = process.env.OLLAMA_URL ?? DEFAULT_OLLAMA_URL;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? DEFAULT_MODEL;

export async function POST(request: NextRequest) {
  try {
    const { messages } = (await request.json()) as {
      messages: ChatMessage[];
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing chat messages in request body." },
        { status: 400 }
      );
    }

    const upstreamResponse = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
      }),
    });

    if (!upstreamResponse.ok) {
      const errorBody = await upstreamResponse.text();
      return NextResponse.json(
        {
          error: `Upstream Ollama request failed with status ${upstreamResponse.status}.`,
          details: errorBody,
        },
        { status: upstreamResponse.status }
      );
    }

    const data = (await upstreamResponse.json()) as {
      message?: { role?: ChatRole; content?: string };
      [key: string]: unknown;
    };

    const reply = data?.message?.content ?? "";

    return NextResponse.json(
      {
        reply,
        raw: data,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error.";
    return NextResponse.json(
      { error: "Failed to process chat request.", details: message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
