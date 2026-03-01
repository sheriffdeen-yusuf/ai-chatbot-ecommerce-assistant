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
exports.ITEMS_COLLECTION = exports.INVENTORY_DATABASE = void 0;
const google_genai_1 = require("@langchain/google-genai");
const output_parsers_1 = require("@langchain/core/output_parsers");
const mongodb_1 = require("mongodb");
const mongodb_2 = require("@langchain/mongodb");
const zod_1 = require("zod");
require("dotenv/config");
exports.INVENTORY_DATABASE = 'inventory_database';
exports.ITEMS_COLLECTION = 'items';
const client = new mongodb_1.MongoClient(process.env.MONGODB_ATLAS_URI);
const llm = new google_genai_1.ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    apiKey: process.env.GOOGLE_API_KEY,
});
// Define schema for furniture item structure using Zod validation
const itemSchema = zod_1.z.object({
    item_id: zod_1.z.string(),
    item_name: zod_1.z.string(),
    item_description: zod_1.z.string(),
    brand: zod_1.z.string(),
    manufacturer_address: zod_1.z.object({
        street: zod_1.z.string(),
        city: zod_1.z.string(),
        state: zod_1.z.string(),
        postal_code: zod_1.z.string(),
        country: zod_1.z.string(),
    }),
    prices: zod_1.z.object({
        full_price: zod_1.z.number(),
        sale_price: zod_1.z.number(),
    }),
    categories: zod_1.z.array(zod_1.z.string()),
    user_reviews: zod_1.z.array(zod_1.z.object({
        review_date: zod_1.z.string(),
        rating: zod_1.z.number(),
        comment: zod_1.z.string(),
    })),
    notes: zod_1.z.string(),
});
const parser = output_parsers_1.StructuredOutputParser.fromZodSchema(zod_1.z.array(itemSchema));
function setupDatabaseAndCollection() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Setting up database and collections...');
        const db = client.db(exports.INVENTORY_DATABASE);
        const collections = yield db.listCollections({ name: exports.ITEMS_COLLECTION }).toArray();
        if (collections.length === 0) {
            yield db.createCollection('items');
            console.log('created "items" collection in "inventory_database"');
        }
        else {
            console.log("'items' collection already exists in 'inventory_database' database");
        }
    });
}
function createVectorSearchIndex() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = client.db(exports.INVENTORY_DATABASE);
            const collection = db.collection(exports.ITEMS_COLLECTION);
            yield collection.dropIndexes();
            const vectorSearchIdx = {
                name: 'vector_index',
                type: 'vectorSearch',
                definition: {
                    fields: [
                        {
                            type: 'vector',
                            path: 'embedding',
                            numDimensions: 3072,
                            similarity: 'cosine',
                        },
                    ],
                },
            };
            console.log('Creating vector search index ...');
            yield collection.createSearchIndex(vectorSearchIdx);
            console.log('Successfully created vector search index');
        }
        catch (error) {
            console.error('Error creating. vector search index: ', error);
        }
    });
}
function generateSynthenticData() {
    return __awaiter(this, void 0, void 0, function* () {
        const prompt = `You are a helpful assistant that generates
   furniture store item data. Generate 10 furniture store items.
    Each record should include the following fields: item_id, item_name, item_description,
    brand, manufacturer_address, prices, categories, user_reviews, notes. Ensure variety 
    in the data and realistic values.
    
     ${parser.getFormatInstructions()}`;
        console.log('Generating synthenic data...');
        const response = yield llm.invoke(prompt);
        return (yield parser.parse(response.content));
    });
}
// Function to create a searchable text summary from furniture item data
function createItemSummary(item) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            const manufacturerDetails = `Made in ${item.manufacturer_address.country}`;
            const categories = item.categories.join(', ');
            const userReviews = item.user_reviews
                .map((review) => `Rated ${review.rating} on ${review.review_date}: ${review.comment}`)
                .join(' ');
            const basicInfo = `${item.item_name} ${item.item_description} from the brand ${item.brand}`;
            const price = `At full price it costs: ${item.prices.full_price} USD, On sale it costs: ${item.prices.sale_price} USD`;
            const notes = item.notes;
            const summary = `${basicInfo}. Manufacturer: ${manufacturerDetails}. Categories: ${categories}. Reviews: ${userReviews}. Price: ${price}. Notes: ${notes}`;
            resolve(summary);
        });
    });
}
function seedDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Connecting to MongoDB....');
            yield client.connect();
            yield client.db('admin').command({ ping: 1 });
            console.log('You successfully connected to MongoDB!');
            yield setupDatabaseAndCollection();
            yield createVectorSearchIndex();
            const db = client.db(exports.INVENTORY_DATABASE);
            const collection = db.collection(exports.ITEMS_COLLECTION);
            yield collection.deleteMany({});
            console.log('Cleared existing data from items collection');
            const synthenticData = yield generateSynthenticData();
            const recordsWithSummaries = yield Promise.all(synthenticData.map((record) => __awaiter(this, void 0, void 0, function* () {
                return ({
                    pageContent: yield createItemSummary(record),
                    metadata: Object.assign({}, record),
                });
            })));
            for (const record of recordsWithSummaries) {
                yield mongodb_2.MongoDBAtlasVectorSearch.fromDocuments([record], new google_genai_1.GoogleGenerativeAIEmbeddings({
                    modelName: 'gemini-embedding-001',
                    apiKey: process.env.GOOGLE_API_KEY,
                }), {
                    collection,
                    indexName: 'vector_index',
                    textKey: 'embedding_text',
                    embeddingKey: 'embedding',
                });
                console.log('Successfully processed & saved record:', record.metadata.item_id);
                yield new Promise((res) => setTimeout(res, 5000)); // 5s delay between requests
                console.log('Waiting for  5 seconds before processing the next record...');
            }
            console.log('Database seeding completed');
        }
        catch (error) {
            console.error('Error sedding database', error);
        }
        finally {
            yield client.close();
        }
    });
}
seedDatabase().catch(console.error);
