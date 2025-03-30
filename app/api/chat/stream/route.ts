
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import { submitQuestion } from "@/lib/langgraph";
import { ChatRequestBody, StreamMessage, StreamMessageType } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { NextResponse } from "next/server";

const SSE_DATA_PREFIX = 'data: ';
const SSE_LINE_DELIMITER = '\n\n';

async function sendSSEMessage(
    writer: WritableStreamDefaultWriter<Uint8Array>,
    data: StreamMessage
): Promise<void> {
    try {
        // Use TextEncoder instead of TextDecoder
        const encoder = new TextEncoder();

        // Create the SSE message format
        const message = `${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`;

        // Encode and write the message
        const encodedData = encoder.encode(message);
        await writer.write(encodedData);
    } catch (error) {
        console.error('Error sending SSE message:', error);
        throw new Error('Failed to send SSE message');
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new Response("Unauthorized", { status: 401 });
        }

        const body = (await req.json()) as ChatRequestBody;
        const { messages, newMessage, chatId } = body;

        const convex = getConvexClient();

        const stream = new TransformStream({}, { highWaterMark: 1024 });

        const writer = stream.writable.getWriter();

        const response = new Response(stream.readable, {
            headers: {
                "content-type": "application/event-stream",
                "cache-control": "no-cache, no-transform",
                Connection: "keep-alive",
                "x-Accel-Buffering": "no",
            },
        });

        // Define startStream inside and immediately invoke it
        const startStream = async () => {
            try {
                // Send initial connection established message
                await sendSSEMessage(writer, { type: StreamMessageType.Connected });

                // Send user message to convex
                await convex.mutation(api.messages.send, {
                    chatId,
                    content: newMessage,
                });

                // Convert messages to langchain format
                const langchainMessages = [
                    ...messages.map((msg) =>
                        msg.role === "user"
                            ? new HumanMessage(msg.content)
                            : new AIMessage(msg.content)
                    ),
                    new HumanMessage(newMessage),
                ];

                try {
                    const eventStream = await submitQuestion(langchainMessages, chatId);

                    for await (const event of eventStream) {
                        if (event.event === "on_chat_model_stream") {
                            const token = event.data.chunk;
                            if (token) {
                                const text = token.content.at(0)?.["text"];

                                if (text) {
                                    await sendSSEMessage(writer, {
                                        type: StreamMessageType.Token,
                                        token: text,
                                    });
                                }
                            }
                        } else if (event.event === "on_tool_start") {
                            await sendSSEMessage(writer, {
                                type: StreamMessageType.ToolStart,
                                tool: event.name || "unknown",
                                input: event.data.input,
                            });
                        } else if (event.event === "on_tool_end") {
                            const toolMessage = new ToolMessage(event.data.output);

                            await sendSSEMessage(writer, {
                                type: StreamMessageType.ToolEnd,
                                tool: toolMessage.lc_kwargs.name || "unknown",
                               output: event.data.output,
                            });
                        }
                    }

                    await sendSSEMessage(writer, { type: StreamMessageType.Done });
                } catch (streamError) {
                    console.log("Error in event stream:", streamError);
                    await sendSSEMessage(writer, {
                        type: StreamMessageType.Error,
                        error:
                            streamError instanceof Error
                                ? streamError.message
                                : "Stream processing failed",
                        token: "",
                    });
                }
            } catch (error) {
                console.error("Error in chat API", error);
                await sendSSEMessage(writer, {
                    type: StreamMessageType.Error,
                    error: error instanceof Error ? error.message : "Unknown error",
                    token: "",
                });
            } finally {
                try {
                    await writer.close();
                } catch (closeError) {
                    console.error("Error closing writer", closeError);
                    await sendSSEMessage(writer, {
                        type: StreamMessageType.Error,
                        error: closeError instanceof Error ? closeError.message : "Error closing writer",
                        token: "",
                    });
                }

            }
        };

        // Start the streaming process
        startStream();

        return response;
    } catch (err) {
        console.error("Error in chat API:", err);
        return NextResponse.json(
            { error: "Failed to process chat request" } as const,
            { status: 500 }
        );
    }
}