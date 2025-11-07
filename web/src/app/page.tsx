"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

type Author = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: Author;
  content: string;
  timestamp: number;
}

const formatTimestamp = (value: number) =>
  new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      setSpeechSupported(true);
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!speechEnabled || !speechSupported || !synthRef.current || !text) {
        return;
      }

      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = "en-US";
      synthRef.current.speak(utterance);
    },
    [speechEnabled, speechSupported]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canSubmit = useMemo(
    () => input.trim().length > 0 && !isLoading,
    [input, isLoading]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) {
        return;
      }

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const snapshot = [...messages, userMessage];

      setInput("");
      setMessages(snapshot);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: snapshot.map(({ role, content }) => ({ role, content })),
          }),
        });

        const payload = (await response.json()) as {
          reply?: string;
          error?: string;
          details?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Assistant request failed.");
        }

        const assistantText = payload.reply?.trim() ?? "";

        if (!assistantText) {
          throw new Error("Assistant returned an empty response.");
        }

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantText,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        speak(assistantText);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unexpected error occurred.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [input, messages, speak]
  );

  const handleReset = useCallback(() => {
    setMessages([]);
    setError(null);
    if (speechSupported) {
      synthRef.current?.cancel();
    }
  }, [speechSupported]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>TinyLLaMA Voice Companion</h1>
          <span className={styles.status}>
            {isLoading ? "Thinking..." : "Ready"}
          </span>
        </header>

        <section className={styles.messages}>
          {messages.map((message) => (
            <article
              key={message.id}
              className={`${styles.bubble} ${
                message.role === "user"
                  ? styles.bubbleUser
                  : styles.bubbleAssistant
              }`}
            >
              {message.content}
              <div className={styles.timestamp}>
                {message.role === "user" ? "You" : "TinyLLaMA"} ·{" "}
                {formatTimestamp(message.timestamp)}
              </div>
            </article>
          ))}
          <div ref={messagesEndRef} />
        </section>

        <form className={styles.composer} onSubmit={handleSubmit}>
          <textarea
            className={styles.input}
            placeholder="Ask TinyLLaMA anything..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isLoading}
          />

          <div className={styles.controls}>
            <div className={styles.buttonRow}>
              <button
                type="submit"
                className={`${styles.button} ${styles.buttonPrimary}`}
                disabled={!canSubmit}
              >
                {isLoading ? "Waiting..." : "Send"}
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={handleReset}
              >
                Clear
              </button>
            </div>

            <label className={styles.muted}>
              <input
                type="checkbox"
                checked={speechEnabled && speechSupported}
                onChange={(event) => setSpeechEnabled(event.target.checked)}
                disabled={!speechSupported}
              />{" "}
              Voice playback
              {!speechSupported ? " (not supported on this device)" : ""}
            </label>
          </div>

          {error ? (
            <p className={styles.disclaimer}>{error}</p>
          ) : (
            <p className={styles.disclaimer}>
              Responses are generated by your locally configured Ollama model.
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
