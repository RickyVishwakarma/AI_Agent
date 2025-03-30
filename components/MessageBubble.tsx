"use client";


import { useUser } from "@clerk/clerk-react";

import { BotIcon } from "lucide-react";

import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";

interface MessageBubbleProps {
    content: string;
    isUser?: boolean;
}

const formatMessage = (content: string): string => {
    // First unescape backslashes
    content = content.replace(/\\\\/g, "\n");

    // Then handle newLines
    content = content.replace(/\\n/g, "\n");

    // Remove markdown headers
    content = content.replace(/---START---\n?/g, "").replace(/\n?---END---/g, "");

    // Trim any extra whitespace that might be 
    return content.trim();
}

function MessageBubble({ content, isUser }: MessageBubbleProps) {
    const { user } = useUser();

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={`rounded-2xl px-4 py-2.5 max-w-[85%] md:max-w-[75%] shadow-sm ring-1 ring-inset relative ${
                    isUser
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-900 rounded-bl-none ring-gray-200"
                } `}
            >
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(content) }} />
                </div>

                <div
                    className={`absolute bottom-0 ${isUser
                            ? "right-0 translate-x-1/2 translate-y-1/2"
                            : "left-0 translate-x-1/2 translate-y-1/2"
                        }`}
                >
                    {isUser ? (
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={user?.imageUrl} />
                            <AvatarFallback>
                                {user?.firstName?.charAt(0)}
                                {user?.lastName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <BotIcon className="w-5 h-5 text-white" />
                    )}
                </div>
            </div>
        </div>
    );
}

export default MessageBubble;