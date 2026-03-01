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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongodb_1 = require("mongodb");
const agent_1 = require("./agent");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const client = new mongodb_1.MongoClient(process.env.MONGODB_ATLAS_URI);
function createServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            yield client.db('admin').command({ ping: 1 });
            console.log('Connected to MongoDB Atlas');
            app.get('/', (req, res) => {
                res.send('LangGraph Agent Server');
            });
            app.post('/chat', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const initialMessage = req.body.message;
                const threadId = Date.now().toString();
                console.log(initialMessage);
                try {
                    const response = yield (0, agent_1.callAgent)(client, initialMessage, threadId);
                    res.json({ threadId, response });
                }
                catch (error) {
                    console.error('Error starting conversation:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }));
            // Define endpoint for continuing existing conversations (POST /chat/:threadId)
            app.post('/chat/:threadId', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { threadId } = req.params;
                const { message } = req.body;
                try {
                    const response = yield (0, agent_1.callAgent)(client, message, threadId);
                    res.json({ response });
                }
                catch (error) {
                    console.error('Error in chat:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }));
            const PORT = process.env.PORT || 8000;
            app.listen(PORT, () => {
                console.log(`AI Server running on port ${PORT}`);
            });
        }
        catch (error) {
            console.error('Error connecting to MongoDB:', error);
            process.exit(1);
        }
    });
}
createServer();
