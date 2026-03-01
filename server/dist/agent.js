"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callAgent = callAgent;
const google_genai_1 = require("@langchain/google-genai");
const messages_1 = require("@langchain/core/messages");
const prompts_1 = require("@langchain/core/prompts");
const langgraph_1 = require("@langchain/langgraph");
const prebuilt_1 = require("@langchain/langgraph/prebuilt");
const mongodb_1 = require("@langchain/mongodb");
const langgraph_checkpoint_mongodb_1 = require("@langchain/langgraph-checkpoint-mongodb");
const zod_1 = require("zod");
require("dotenv/config");
const seedDB_1 = require("./seedDB");
const tools_1 = require("@langchain/core/tools");
function retryWithBackoff(fn_1) {
    return __awaiter(this, arguments, void 0, function* (fn, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return yield fn();
            }
            catch (error) {
                if (error.status === 429 && attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
                    console.log(`Rate limit hit. Retrying in ${delay / 1000} seconds...`);
                    yield new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
                throw error;
            }
        }
        throw new Error('Max retries exceeded');
    });
}
function callAgent(client, query, thread_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = client.db(seedDB_1.INVENTORY_DATABASE);
            const collection = db.collection(seedDB_1.ITEMS_COLLECTION);
            const GraphState = langgraph_1.Annotation.Root({
                messages: (0, langgraph_1.Annotation)({
                    reducer: (x, y) => x.concat(y),
                }),
            });
            // Create a custom tool for searching furniture inventory
            const itemLookupTool = (0, tools_1.tool)((_a) => __awaiter(this, [_a], void 0, function* ({ query, n = 10 }) {
                try {
                    const totalCount = yield collection.countDocuments();
                    console.log(`Total documents in collection: ${totalCount}`);
                    if (totalCount === 0) {
                        console.log('Collection is empty');
                        return JSON.stringify({
                            error: 'No items found in inventory',
                            message: 'The inventory database appears to be empty',
                            count: 0,
                        });
                    }
                    const sampleDocs = yield collection.find({}).limit(3).toArray();
                    console.log('Sample documents:', sampleDocs);
                    const dbConfig = {
                        collection: collection,
                        indexName: 'vector_index',
                        textKey: 'embedding_text',
                        embeddingKey: 'embedding',
                    };
                    const vectorStore = new mongodb_1.MongoDBAtlasVectorSearch(new google_genai_1.GoogleGenerativeAIEmbeddings({
                        apiKey: process.env.GOOGLE_API_KEY,
                        model: 'gemini-embedding-001',
                    }), dbConfig);
                    console.log('Performing vector search...');
                    const result = yield vectorStore.similaritySearchWithScore(query, n);
                    console.log(`Vector search returned ${result.length} results`);
                    if (result.length === 0) {
                        console.log('Vector search returned no results, trying text search...');
                        const textResults = yield collection
                            .find({
                            $or: [
                                { item_name: { $regex: query, $options: 'i' } },
                                { item_description: { $regex: query, $options: 'i' } },
                                { categories: { $regex: query, $options: 'i' } },
                                { embedding_text: { $regex: query, $options: 'i' } },
                            ],
                        })
                            .limit(n)
                            .toArray();
                        console.log(`Text search returned ${textResults.length} results`);
                        return JSON.stringify({
                            results: textResults,
                            searchType: 'text',
                            query: query,
                            count: textResults.length,
                        });
                    }
                    return JSON.stringify({
                        results: result,
                        searchType: 'vector',
                        query: query,
                        count: result.length,
                    });
                }
                catch (error) {
                    console.error('Error in item lookup:', error);
                    console.error('Error details:', {
                        message: error.message,
                        stack: error.stack,
                        name: error.name,
                    });
                    return JSON.stringify({
                        error: 'Failed to search inventory',
                        details: error.message,
                        query: query,
                    });
                }
            }), 
            // Tool metadata and schema definition
            {
                name: 'item_lookup',
                description: 'Gathers furniture item details from the Inventory database',
                schema: zod_1.z.object({
                    query: zod_1.z.string().describe('The search query'),
                    n: zod_1.z
                        .number()
                        .optional()
                        .default(10)
                        .describe('Number of results to return'),
                }),
            });
            const tools = [itemLookupTool];
            const toolNode = new prebuilt_1.ToolNode(tools);
            const model = new google_genai_1.ChatGoogleGenerativeAI({
                model: 'gemini-2.5-flash',
                temperature: 0.7,
                apiKey: process.env.GOOGLE_API_KEY,
                maxRetries: 0,
            }).bindTools(tools);
            function shouldContinue(state) {
                var _a;
                const messages = state.messages;
                const lastMessage = messages[messages.length - 1];
                if ((_a = lastMessage.tool_calls) === null || _a === void 0 ? void 0 : _a.length) {
                    return 'tools';
                }
                return '__end__';
            }
            // Function that calls the AI model with retry logic
            function callModel(state) {
                return __awaiter(this, void 0, void 0, function* () {
                    return retryWithBackoff(() => __awaiter(this, void 0, void 0, function* () {
                        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
                            [
                                'system',
                                `You are a helpful E-commerce Chatbot Agent for a furniture store. 

IMPORTANT: You have access to an item_lookup tool that searches the furniture inventory database. ALWAYS use this tool when customers ask about furniture items, even if the tool returns errors or empty results.

When using the item_lookup tool:
- If it returns results, provide helpful details about the furniture items
- If it returns an error or no results, acknowledge this and offer to help in other ways
- If the database appears to be empty, let the customer know that inventory might be being updated

Current time: {time}`,
                            ],
                            new prompts_1.MessagesPlaceholder('messages'),
                        ]);
                        const formattedPrompt = yield prompt.formatMessages({
                            time: new Date().toISOString(),
                            messages: state.messages,
                        });
                        const result = yield model.invoke(formattedPrompt);
                        return { messages: [result] };
                    }));
                });
            }
            // Build the workflow graph
            const workflow = new langgraph_1.StateGraph(GraphState)
                .addNode('agent', callModel)
                .addNode('tools', toolNode)
                .addEdge('__start__', 'agent')
                .addConditionalEdges('agent', shouldContinue)
                .addEdge('tools', 'agent');
            const checkpointer = new langgraph_checkpoint_mongodb_1.MongoDBSaver({ client, dbName: seedDB_1.INVENTORY_DATABASE });
            const app = workflow.compile({ checkpointer });
            // Execute the workflow
            const finalState = yield app.invoke({
                messages: [new messages_1.HumanMessage(query)],
            }, {
                recursionLimit: 15,
                configurable: { thread_id: thread_id },
            });
            const response = finalState.messages[finalState.messages.length - 1].content;
            console.log('Agent response:', response);
            return response;
        }
        catch (error) {
            console.error('Error in callAgent:', error.message);
            if (error.status === 429) {
                throw new Error('Service temporarily unavailable due to rate limits. Please try again in a minute.');
            }
            else if (error.status === 401) {
                throw new Error('Authentication failed. Please check your API configuration.');
            }
            else {
                throw new Error(`Agent failed: ${error.message}`);
            }
        }
    });
}
