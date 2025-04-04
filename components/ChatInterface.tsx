"use client";

import { Id, Doc } from "@/convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { ChatRequestBody, StreamMessage, StreamMessageType } from "@/lib/types";
import { createSSEParser } from "@/lib/createSSEParser";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import WelcomeMessage from "./WelcomeMessage";

interface ChatInterfaceProps {
  chatId: Id<"chats">;
  initialMessages: Doc<"messages">[];
}

export default function ChatInterface({ chatId, initialMessages }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Doc<"messages">[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [streamedResponse, setStreamedResponse] = useState("");
  const [currentTool, setCurrentTool] = useState<{
    name: string;
    input: unknown;
  } | null>(null);


  const messageEndRef = useRef<HTMLDivElement>(null);

  const updateChatTitle = useMutation(api.chats.updateTitle);




  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear any previous errors

    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // If this is the first message, update the chat title
    if (messages.length === 0) {
      // Take first 30 characters of the message as title
      const newTitle = trimmedInput.slice(0, 30) + (trimmedInput.length > 30 ? "..." : "");
      await updateChatTitle({ id: chatId, title: newTitle });
    }

    // Reset UI state for new messages
    setInput("");
    setStreamedResponse("");
    setCurrentTool(null);
    setIsLoading(true);

    const optimisticUserMessage: Doc<"messages"> = {
      _id: `temp_${Date.now()}`,
      chatId,
      content: trimmedInput,
      role: "user",
      createdAt: Date.now(),
    } as Doc<"messages">;

    setMessages((prev) => [...prev, optimisticUserMessage]);

    let fullResponse = "";

    try {
      const requestBody: ChatRequestBody = {
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        newMessage: trimmedInput, // Using newMessages to match the interface definition
        chatId,
      };
      
      // Initialize SSE connection
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message?.includes('credit balance is too low')) {
            throw new Error('Your API credit balance is too low. Please upgrade your plan or purchase more credits.');
          }
        } catch {
          // If JSON parsing fails, just use the error text
        }
        throw new Error(errorText);
      }
      if (!response.body) throw new Error("No response body available");

      // -----------------------HANDLE THE STREAM-----------------------
      // Create SSE parser and reader

      const parser = createSSEParser();
      const reader = response.body.getReader();

      // Remove the processStream call since we're handling it in the while loop
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = new TextDecoder().decode(value);
          const messages = parser.parse(chunk);

          for (const message of messages) {
            const parsed = message as StreamMessage;

            switch (parsed.type) {
              case StreamMessageType.Token:
                fullResponse += parsed.token;
                setStreamedResponse(fullResponse);
                break;
              case StreamMessageType.ToolStart:
                setCurrentTool({
                  name: parsed.tool,
                  input: parsed.input,
                });
                break;
              case StreamMessageType.ToolEnd:
                setCurrentTool(null);
                break;
              case StreamMessageType.Done: {
                // Add the completed response to messages
                const assistantMessage: Doc<"messages"> = {
                  _id: `ai_${Date.now()}`,
                  chatId,
                  content: fullResponse,
                  role: "assistant",
                  createdAt: Date.now(),
                } as Doc<"messages">;
                
                const convex = getConvexClient();
                console.log("DEBUG >> ", fullResponse)
                await convex.mutation(api.messages.store, {
                    chatId,
                    content: fullResponse,
                    role: "assistant",
                });
                // Add the optimistic user message
                setMessages((prev) => [...prev, optimisticUserMessage, assistantMessage]);
                setStreamedResponse("");
                break;
              }
              case StreamMessageType.Error: {
                throw new Error(parsed.error);
                break;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending messages", error);
      // Remove the optimistic user message if there was an error
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== optimisticUserMessage._id)
      );

      // Set user-friendly error message
      if (error instanceof Error && error.message.includes('credit balance is too low')) {
        setError('Your API credit balance is too low. Please upgrade your plan or purchase more credits.');
      } else {
        setError(error instanceof Error ? error.message : 'An error occurred while processing your message');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-[calc(100vh-theme(spacing.14))]">
      {/* Messages */}
      <section className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages?.length === 0 && <WelcomeMessage/>}
          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message._id}
              className={`p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-100 ml-auto max-w-[80%]"
                  : "bg-gray-100 mr-auto max-w-[80%]"
              }`}
            >
              {message.content}
            </div>

          ))}

          {/* Streamed Response */}
          {streamedResponse && (
            <div className="bg-gray-100 p-3 rounded-lg mr-auto max-w-[80%]">
              {streamedResponse}
              {isLoading && <span className="animate-pulse">▌</span>}
            </div>
          )}

          {/* {Loading indicator} */}

          {isLoading && !streamedResponse && (
            <div className="flex justify-start animate-in fade-in-0">
              <div className="rounded-2xl px-4 py-3 bg-white text-gray-900
                rounded-bl-none shadow-sm ring-1 ring-inset rinf-gray-200 ">
                  <div className="flex items-center gap-1.5">
                    {[0.3, 0.15, 0].map((delay, i) => (
                      <div
                        key={i}
                        className="h-1 w-1 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: `${delay}s` }}
                      />
                    ))}
                  </div>

              </div>

            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex justify-start animate-in fade-in-0 mb-4">
              <div className="rounded-2xl px-4 py-3 bg-red-50 text-red-900
                rounded-bl-none shadow-sm ring-1 ring-inset ring-red-200">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tool Use Display */}
          {currentTool && (
            <div className="bg-amber-100 p-3 rounded-lg border border-amber-300 mr-auto max-w-[80%]">
              <div className="font-medium">Using tool: {currentTool.name}</div>
              <div className="text-sm opacity-75 mt-1">
                {JSON.stringify(currentTool.input)}
              </div>
            </div>
          )}

          {/* Last Message */}
          <div ref={messageEndRef} />
        </div>
      </section>

      <footer className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message AI Agent..."
              className="flex-1 py-3 px-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2
              focus:ring-blue-500 focus:border-transparent pr-12 bg-gray-50 placeholder:text-gray-500"
              disabled={isLoading}
            />

            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`absolute right-1.5 rounded-xl h-9 w-9 p-0 flex items-center justify-center transition-all ${
                input.trim()
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <ArrowRight />
            </Button>
          </div>
        </form>
      </footer>
    </main>
  );
}
