// app/api/chat/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { messages, settings, stream = false } = await request.json();

    const temperature = settings?.temperature ?? 0.7;
    const maxTokens = settings?.maxTokens ?? 2000;

    // 👈 DEFAULT Gemini model
    // Map user-friendly names to actual available model names
    const rawModelName = settings?.modelName ?? "gemini-2.5-flash";
    let modelName = rawModelName;

    // Map to actual available model names (from /api/models endpoint)
    const modelNameMap: { [key: string]: string } = {
      "gemini-1.5-flash": "gemini-2.5-flash", // Use 2.5 as 1.5 not available
      "gemini-1.5-pro": "gemini-2.5-pro", // Use 2.5 as 1.5 not available
      "gemini-2.5-flash": "gemini-2.5-flash", // Stable
      "gemini-2.5-pro": "gemini-2.5-pro", // Stable
      "gemini-2.0-flash": "gemini-2.0-flash-001", // Stable
      "gemini-pro": "gemini-pro-latest", // Latest
      "gemini-flash": "gemini-flash-latest", // Latest
    };

    modelName = modelNameMap[modelName] || modelName;

    // Remove 'models/' prefix if present (SDK handles it)
    if (modelName.startsWith("models/")) {
      modelName = modelName.replace("models/", "");
    }

    const isGemini = modelName.startsWith("gemini");
    const isOpenAI = modelName.startsWith("gpt");

    // SYSTEM MESSAGE
    const systemMessage = `
You are a powerful AI assistant. Follow these rules:
- Use markdown formatting.
- Give clear, structured, accurate answers.
- Use examples when useful.
- Write clean, commented code.
- Ask for clarification when required.
- Do not hallucinate.
`.trim();

    // -----------------------------------------------------------------------
    // GEMINI (REST API) — 100% WORKING
    // -----------------------------------------------------------------------
    if (isGemini) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { 
            error: "Missing Gemini API Key",
            message: "Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.",
            details: "Get your API key from https://makersuite.google.com/app/apikey"
          },
          { status: 500 }
        );
      }

      // Use the SDK instead of REST API (handles model names correctly)
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      });

      // Convert messages to Gemini format
      const chatHistory = messages
        .slice(0, -1)
        .map((m: { role: string; content: string }) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const lastMessage = messages[messages.length - 1].content;

      // Add system message as first user message
      const fullHistory = [
        {
          role: "user",
          parts: [{ text: systemMessage }],
        },
        {
          role: "model",
          parts: [
            {
              text: "I understand. I will follow these guidelines and provide helpful, accurate, and well-formatted responses.",
            },
          ],
        },
        ...chatHistory,
      ];

      const chat = model.startChat({
        history: fullHistory,
      });

      // ---------------- STREAM MODE ----------------
      if (stream) {
        const result = await chat.sendMessageStream(lastMessage);

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ content: text })}\n\n`
                    )
                  );
                }
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (err) {
              console.error("Stream error:", err);
              const errorMessage = err instanceof Error ? err.message : String(err);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ 
                    error: true, 
                    message: `Streaming error: ${errorMessage}`,
                    details: errorMessage
                  })}\n\n`
                )
              );
              controller.close();
            }
          },
        });

        return new Response(readable, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      // ---------------- NON-STREAM MODE ----------------
      const result = await chat.sendMessage(lastMessage);
      const response = await result.response;
      const text = response.text();

      return NextResponse.json({
        message: text,
        model: modelName,
        provider: "gemini",
      });
    }

    // -----------------------------------------------------------------------
    // OPENAI (SDK)
    // -----------------------------------------------------------------------
    if (isOpenAI) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { 
            error: "Missing OpenAI API Key",
            message: "OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.",
            details: "Get your API key from https://platform.openai.com/api-keys"
          },
          { status: 500 }
        );
      }

      const openai = new OpenAI({ apiKey });

      const conversation = [
        { role: "system", content: systemMessage },
        ...messages,
      ];

      // ---- STREAM ----
      if (stream) {
        const resp = await openai.chat.completions.create({
          model: modelName,
          messages: conversation,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        });

        const encoder = new TextEncoder();

        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of resp) {
                const text = chunk.choices?.[0]?.delta?.content ?? "";
                if (text) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ content: text })}\n\n`
                    )
                  );
                }
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (err) {
              console.error("Stream error:", err);
              const errorMessage = err instanceof Error ? err.message : String(err);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ 
                    error: true, 
                    message: `Streaming error: ${errorMessage}`,
                    details: errorMessage
                  })}\n\n`
                )
              );
              controller.close();
            }
          },
        });

        return new Response(readable, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      // ---- NON-STREAM ----
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: conversation,
        temperature,
        max_tokens: maxTokens,
      });

      return NextResponse.json({
        message: completion.choices[0].message.content,
        model: modelName,
        provider: "openai",
      });
    }

    // -----------------------------------------------------------------------
    // UNKNOWN MODEL
    // -----------------------------------------------------------------------
    return NextResponse.json(
      {
        error: "Unsupported Model",
        message: `The model "${modelName}" is not supported or recognized.`,
        details: "Please select a supported model from the settings. Valid models include Gemini models (gemini-2.5-flash, gemini-2.5-pro, etc.) or OpenAI models (gpt-4, gpt-3.5-turbo, etc.).",
      },
      { status: 400 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("API ERROR:", err);
    
    // Check for common API errors and provide helpful messages
    let message = "An unexpected error occurred while processing your request.";
    const details = errorMessage;
    
    if (errorMessage.includes("API key")) {
      message = "There's an issue with your API key. Please check your configuration.";
    } else if (errorMessage.includes("quota") || errorMessage.includes("rate limit")) {
      message = "API rate limit or quota exceeded. Please try again later or check your API usage.";
    } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      message = "Network error. Please check your internet connection and try again.";
    } else if (errorMessage.includes("model")) {
      message = "There's an issue with the selected model. Please try a different model.";
    }
    
    return NextResponse.json(
      {
        error: "Request Failed",
        message,
        details,
      },
      { status: 500 }
    );
  }
}
