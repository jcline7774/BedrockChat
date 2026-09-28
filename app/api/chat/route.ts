import { NextRequest } from "next/server";
import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  type Message,
} from "@aws-sdk/client-bedrock-runtime";

// Run on the Node.js runtime (not Edge) since the AWS SDK relies on Node APIs.
export const runtime = "nodejs";

// Cross-region inference profile ID for Claude 3.5 Sonnet on Bedrock.
// Swap this for whichever model ID is enabled in your AWS account's Bedrock console.
const MODEL_ID = "us.anthropic.claude-sonnet-4-5-20250929-v1:0";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

interface ChatRequestBody {
  message: string;
}

export async function POST(req: NextRequest) {
  const { message }: ChatRequestBody = await req.json();

  if (!message || typeof message !== "string") {
    return new Response("Missing 'message' in request body.", { status: 400 });
  }

  const messages: Message[] = [
    {
      role: "user",
      content: [{ text: message }],
    },
  ];

  const command = new ConverseStreamCommand({
    modelId: MODEL_ID,
    messages,
    inferenceConfig: {
      maxTokens: 1024,
      temperature: 0.5,
    },
  });

  // Bridge the Bedrock async stream into a Web ReadableStream the browser can consume
  // with a plain fetch() + reader, one token at a time, as it arrives.
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const response = await client.send(command);

        if (!response.stream) {
          controller.close();
          return;
        }

        for await (const event of response.stream) {
          const delta = event.contentBlockDelta?.delta;
          if (delta && "text" in delta && delta.text) {
            controller.enqueue(encoder.encode(delta.text));
          }
        }

        controller.close();
      } catch (err) {
        console.error("Bedrock streaming error:", err);
        controller.enqueue(
          encoder.encode(
            "\n\n[Error: the model call failed. Check AWS credentials, region, and that this model ID is enabled in your Bedrock console.]"
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
