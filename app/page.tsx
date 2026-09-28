"use client";

import { useRef, useState, type FormEvent } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    // Placeholder assistant message we'll fill in as tokens arrive.
    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      });

      if (!res.body) throw new Error("No response body from /api/chat");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Read the stream chunk by chunk, appending each piece to the last
      // (assistant) message as it arrives — this is what makes the UI feel
      // like the model is "typing" instead of waiting for one big response.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error(err);
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: "Something went wrong reaching the model. Check the server console.",
          };
          return next;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <main className="page">
      <header className="header">
        <h1>Bedrock Streaming Chat</h1>
        <p>Next.js App Router · TypeScript · Amazon Bedrock (Claude) · ConverseStream</p>
      </header>

      <div className="messages">
        {messages.length === 0 && (
          <p className="empty">Ask something below to see the response stream in real time.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <span className="role">{m.role === "user" ? "You" : "Claude"}</span>
            <p>{m.content || (isStreaming && i === messages.length - 1 ? "…" : "")}</p>
          </div>
        ))}
      </div>

      <form className="composer" onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming || !input.trim()}>
          {isStreaming ? "Streaming…" : "Send"}
        </button>
      </form>

      <style jsx>{`
        .page {
          max-width: 720px;
          margin: 0 auto;
          padding: 2rem 1.25rem 3rem;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .header h1 {
          font-size: 1.5rem;
          margin: 0 0 0.25rem;
        }
        .header p {
          color: #6b7280;
          font-size: 0.85rem;
          margin: 0 0 1.5rem;
        }
        .messages {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        .empty {
          color: #9ca3af;
          font-size: 0.9rem;
        }
        .bubble {
          border-radius: 10px;
          padding: 0.6rem 0.9rem;
          max-width: 85%;
        }
        .bubble .role {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          opacity: 0.6;
          margin-bottom: 0.15rem;
        }
        .bubble p {
          margin: 0;
          white-space: pre-wrap;
          line-height: 1.45;
        }
        .bubble.user {
          align-self: flex-end;
          background: #1f3864;
          color: white;
        }
        .bubble.assistant {
          align-self: flex-start;
          background: #f1f3f6;
          color: #111827;
        }
        .composer {
          display: flex;
          gap: 0.5rem;
        }
        .composer input {
          flex: 1;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 0.6rem 0.75rem;
          font-size: 0.95rem;
        }
        .composer button {
          background: #1f3864;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.6rem 1.1rem;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .composer button:disabled {
          opacity: 0.5;
          cursor: default;
        }
      `}</style>
    </main>
  );
}
