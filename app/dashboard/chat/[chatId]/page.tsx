import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getConvexClient } from "@/lib/convex";
import ChatClient from "./ChatClient";

type PageProps = {
  params: {
    chatId: Id<"chats">;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ChatPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }
  
  // get convex client and fetch chat and messages
  try {
    const convex = getConvexClient();
    const result = await convex.query(api.messages.list, { chatId: params.chatId });
    const initialMessages = result.messages;

    return <ChatClient chatId={params.chatId} initialMessages={initialMessages} />;
  } catch (error) {
    console.error("🔥 Error loading chat: ", error);
    redirect("/dashboard");
  }
}