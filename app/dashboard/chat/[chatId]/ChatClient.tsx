"use client";

import ChatInterface from "@/components/ChatInterface";
import { Doc, Id } from "@/convex/_generated/dataModel";

interface ChatClientProps {
  chatId: Id<"chats">;
  initialMessages: Doc<"messages">[];
}

export default function ChatClient({ chatId, initialMessages }: ChatClientProps) {
  return <ChatInterface chatId={chatId} initialMessages={initialMessages} />;
} 