import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StateGraph, END, START, MessagesAnnotation, MemorySaver } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
// import { MessagesAnnotation } from "@langchain/langgraph/prebuilt";
// import { MemorySaver } from "@langchain/langgraph/prebuilt";
import wxflows from "@wxflows/sdk/langchain";

// Define the system message constant that was referenced but not defined
const SYSTEM_MESSAGE = `You are a helpful AI assistant that can use tools when necessary to help users with their questions.
Please respond in a clear, concise, and friendly manner.`;

// Define or import the trimmer that was referenced but not defined
// Assuming a basic implementation if it's not imported from elsewhere
const trimmer = {
  invoke: async (messages: BaseMessage[]) => {
    // Keep only the last 10 messages to manage context size
    if (messages.length > 10) {
      return messages.slice(messages.length - 10);
    }
    return messages;
  }
};

const toolClient = new wxflows({
  endpoint: process.env.WXFLOWS_ENDPOINT || "",
  apikey: process.env.WXFLOWS_APIKEY,
});

// This should be inside an async function or use top-level await in ESM
export async function initTools() {
  const tools = await toolClient.lcTools;
  return tools;
}

export const initialiseModel = async () => {
  const tools = await initTools();
  const toolNode = new ToolNode(tools);
  
  const model = new ChatAnthropic({
    modelName: "claude-3-5-sonnet-20241022",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.7,
    maxTokens: 4096,
    streaming: true,
    clientOptions: {
      defaultHeaders: {
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
    },
    callbacks: [
      {
        handleLLMStart: async () => {
          //console.log("Starting LLM call");
        },
        handleLLMEnd: async (output) => {
          // console.log("END LLM call", output);
          const usage = output.llmOutput?.usage;
          output.generations.map((generation) => {
            console.log("Generation:", JSON.stringify(generation));
          });
          if (usage) {
            // console.log("Token Usage", {
            //   input_token: usage.input_tokens,
            //   output_tokens: usage.output_tokens,
            //   total_tokens: usage.input_tokens + usage.output_tokens,
            //   cache_creation_input_tokens: usage.cache_creation_input_tokens || 0,
            //   cache_read_input_tokens: usage.cache_read_input_tokens || 0,
            // });
          }
        },
        handleLLMNewToken: async (token: string) => {
          console.log("New Token", token);
        }
      }
    ]
  }).bindTools(tools);

  return { model, tools, toolNode };
};

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls) return "tools";

  // If the last message is a tool message, route back to agent
  if (lastMessage.content && lastMessage._getType() === "tool") {
    return "agent";
  }

  return END;
}

export const createWorkflow = async () => {
  const { model, toolNode } = await initialiseModel();
  
  const stateGraph = new StateGraph(MessagesAnnotation)
    .addNode(
      "agent",
      async (state: { messages: BaseMessage[]; }) => {
        // Create the system message content
        const systemContent = SYSTEM_MESSAGE;
        
        // Create the prompt template with system message placeholder
        const promptTemplate = ChatPromptTemplate.fromMessages([
          new SystemMessage(systemContent, {
            cache_control: { type: "ephemeral" }, // Set a cache breakpoint (max number of breakpoints is 4)
          }),
          new MessagesPlaceholder("messages"),
        ]);

        // Trim the messages to manage conversation history
        const trimmedMessages = await trimmer.invoke(state.messages);

        // Format the prompt with the current messages
        const prompt = await promptTemplate.invoke({ messages: trimmedMessages });

        // Get response from the model
        const response = await model.invoke(prompt);

        return { messages: [response] };
      }
    )
    .addEdge(START, "agent")
    .addNode("tools", toolNode)
    .addConditionalEdges("agent", shouldContinue);

  return stateGraph;
};

function addCachingHeaders(messages: BaseMessage[]): BaseMessage[] {
  // Rules of caching headers for turn-by-turn
  // 1. Cache the first SYSTEM message
  // 2. Cache the LAST message
  // 3. Cache the second to last HUMAN message 

  if (!messages.length) return messages;

  const cachedMessages = [...messages];

  const addCache = (message: BaseMessage) => {
    message.content = [{
      type: "text",
      text: message.content as string,
      cache_control: { type: "ephemeral" }
    }];
  };

  // Cache the last message 
  // console.log("Caching last message");
  addCache(cachedMessages[cachedMessages.length - 1]);

  let humanCount = 0;

  for (let i = cachedMessages.length - 1; i >= 0; i--) {
    if (cachedMessages[i] instanceof HumanMessage) {
      humanCount++;

      if (humanCount === 2) {
        // console.log("Caching second-to-last human message");
        addCache(cachedMessages[i]);
        break;
      }
    }
  }

  return cachedMessages;
}

export async function submitQuestion(messages: BaseMessage[], chatId: string) {
  const cachedMessages = addCachingHeaders(messages);

  console.log("Messages: ", cachedMessages);

  const workflow = await createWorkflow();

  // Create a checkpoint to save the state of the conversation
  const checkpointer = new MemorySaver();

  const app = workflow.compile({ checkpointer });

  const stream = await app.streamEvents(
    {
      messages: cachedMessages,
    },
    {
      version: "v2",
      configurable: {
        thread_id: chatId,
      },
      streamMode: "messages",
      runId: chatId,
    }
  );

  return stream;
}