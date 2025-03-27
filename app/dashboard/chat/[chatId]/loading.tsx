

export default function Loading() {
    // Persist the number of messages for consistency
    const numMessages = Math.floor(Math.random() * 5) + 2;

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            {/* Message Section */}
            <div className="h-[calc(100vh-65px)] flex flex-col w-full">
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {[...Array(numMessages)].map((_, i) => {
                            const isUserMessage = i % 2 === 0;
                            return (
                                <div key={i} className={`flex ${isUserMessage ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`w-2/3 rounded-2xl p-4 ${
                                            isUserMessage
                                                ? "bg-blue-600/10 rounded-br-none"
                                                : "bg-white rounded-bl-none border border-gray-200"
                                        }`}
                                    >
                                        <div className="space-y-3">
                                            <div className={`h-4 animate-pulse rounded w-[90%] ${isUserMessage ? "bg-white/40" : "bg-gray-200"}`} />
                                            <div className={`h-4 animate-pulse rounded w-[75%] ${isUserMessage ? "bg-white/40" : "bg-gray-200"}`} />
                                            <div className={`h-4 animate-pulse rounded w-[60%] ${isUserMessage ? "bg-white/40" : "bg-gray-200"}`} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Input Section */}
                <div className="border-t bg-white p-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="h-12 bg-gray-100 rounded-full animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
