// app/api/models/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    // List available models using the API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Failed to fetch models: ${response.status}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Filter models that support generateContent
    interface ModelInfo {
      name: string;
      displayName?: string;
      description?: string;
      version?: string;
      supportedGenerationMethods?: string[];
    }
    
    const availableModels = (data.models as ModelInfo[])
      ?.filter((model) => 
        model.supportedGenerationMethods?.includes("generateContent")
      )
      .map((model) => ({
        name: model.name,
        displayName: model.displayName,
        description: model.description,
        version: model.version,
      })) || [];

    return NextResponse.json({
      models: availableModels,
      count: availableModels.length,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching models:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch models",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}




// import { NextResponse } from "next/server";

// export const dynamic = "force-dynamic";

// export async function GET() {
//   try {
//     const GEMINI_KEY = process.env.GEMINI_API_KEY;
//     const OPENAI_KEY = process.env.OPENAI_API_KEY;

//     if (!GEMINI_KEY && !OPENAI_KEY) {
//       return NextResponse.json(
//         { error: "Missing API keys: GEMINI_API_KEY or OPENAI_API_KEY" },
//         { status: 500 }
//       );
//     }

//     /* ---------------------------
//         1) Fetch Gemini Models
//     ---------------------------- */
//     let geminiModels: any[] = [];
//     if (GEMINI_KEY) {
//       try {
//         const res = await fetch(
//           "https://generativelanguage.googleapis.com/v1beta/models?key=" +
//             GEMINI_KEY
//         );

//         const data = await res.json();
//         geminiModels =
//           data.models
//             ?.filter((m: any) =>
//               m.supportedGenerationMethods?.includes("generateContent")
//             )
//             .map((m: any) => ({
//               provider: "gemini",
//               name: m.name,
//               displayName: m.displayName,
//               description: m.description,
//               version: m.version,
//             })) || [];
//       } catch {
//         console.warn("Failed to fetch Gemini Models");
//       }
//     }

//     /* ---------------------------
//         2) Fetch OpenAI Models
//     ---------------------------- */
//     let openaiModels: any[] = [];
//     if (OPENAI_KEY) {
//       try {
//         const res = await fetch("https://api.openai.com/v1/models", {
//           headers: {
//             Authorization: `Bearer ${OPENAI_KEY}`,
//           },
//         });

//         const data = await res.json();

//         // Filter useful models only
//         const ALLOWED_PREFIXES = [
//           "gpt-4o",
//           "gpt-4.1",
//           "gpt-4",
//           "gpt-3.5",
//           "o3",
//         ];

//         openaiModels =
//           data.data
//             ?.filter((m: any) =>
//               ALLOWED_PREFIXES.some((prefix) => m.id.startsWith(prefix))
//             )
//             .map((m: any) => ({
//               provider: "openai",
//               name: m.id,
//               displayName: m.id,
//               description: "OpenAI model",
//             })) || [];
//       } catch {
//         console.warn("Failed to fetch OpenAI Models");
//       }
//     }

//     /* ---------------------------
//         3) Merge + Sort
//     ---------------------------- */
//     const allModels = [...geminiModels, ...openaiModels];

//     return NextResponse.json({
//       models: allModels,
//       count: allModels.length,
//     });
//   } catch (error: any) {
//     return NextResponse.json(
//       {
//         error: "Failed to fetch models",
//         details: error.message,
//       },
//       { status: 500 }
//     );
//   }
// }
