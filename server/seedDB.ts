import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from '@langchain/google-genai';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { MongoClient } from 'mongodb';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { z } from 'zod';

import 'dotenv/config';

const INVENTORY_DATABASE = 'inventory_database';
const ITEMS_COLLECTION = 'items';

const client = new MongoClient(process.env.MONGODB_ATLAS_URI as string);

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  apiKey: process.env.GOOGLE_API_KEY,
});

// Define schema for furniture item structure using Zod validation
const itemSchema = z.object({
  item_id: z.string(),
  item_name: z.string(),
  item_description: z.string(),
  brand: z.string(),
  manufacturer_address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    country: z.string(),
  }),
  prices: z.object({
    full_price: z.number(),
    sale_price: z.number(),
  }),
  categories: z.array(z.string()),
  user_reviews: z.array(
    z.object({
      review_date: z.string(),
      rating: z.number(),
      comment: z.string(),
    }),
  ),
  notes: z.string(),
});

type Item = z.infer<typeof itemSchema>;

const parser = StructuredOutputParser.fromZodSchema(z.array(itemSchema) as any);

async function setupDatabaseAndCollection(): Promise<void> {
  console.log('Setting up database and collections...');
  const db = client.db(INVENTORY_DATABASE);
  const collections = await db.listCollections({ name: ITEMS_COLLECTION }).toArray();

  if (collections.length === 0) {
    await db.createCollection('items');
    console.log('created "items" collection in "inventory_database"');
  } else {
    console.log(
      "'items' collection already exists in 'inventory_database' database",
    );
  }
}

async function createVectorSearchIndex(): Promise<void> {
  try {
    const db = client.db(INVENTORY_DATABASE);
    const collection = db.collection(ITEMS_COLLECTION);
    await collection.dropIndexes();

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
    await collection.createSearchIndex(vectorSearchIdx);
    console.log('Successfully created vector search index');
  } catch (error) {
    console.error('Error creating. vector search index: ', error);
  }
}

async function generateSynthenticData(): Promise<Item[]> {
  const prompt = `You are a helpful assistant that generates
   furniture store item data. Generate 10 furniture store items.
    Each record should include the following fields: item_id, item_name, item_description,
    brand, manufacturer_address, prices, categories, user_reviews, notes. Ensure variety 
    in the data and realistic values.
    
     ${parser.getFormatInstructions()}`;

  console.log('Generating synthenic data...');

  const response = await llm.invoke(prompt);

  return (await parser.parse(response.content as string)) as Item[];
}

// Function to create a searchable text summary from furniture item data
async function createItemSummary(item: Item): Promise<string> {
  return new Promise((resolve) => {
    const manufacturerDetails = `Made in ${item.manufacturer_address.country}`;
    const categories = item.categories.join(', ');
    const userReviews = item.user_reviews
      .map(
        (review) =>
          `Rated ${review.rating} on ${review.review_date}: ${review.comment}`,
      )
      .join(' ');
    const basicInfo = `${item.item_name} ${item.item_description} from the brand ${item.brand}`;
    const price = `At full price it costs: ${item.prices.full_price} USD, On sale it costs: ${item.prices.sale_price} USD`;
    const notes = item.notes;

    const summary = `${basicInfo}. Manufacturer: ${manufacturerDetails}. Categories: ${categories}. Reviews: ${userReviews}. Price: ${price}. Notes: ${notes}`;

    resolve(summary);
  });
}

async function seedDatabase(): Promise<void> {
  try {
    console.log('Connecting to MongoDB....');

    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('You successfully connected to MongoDB!');

    await setupDatabaseAndCollection();

    await createVectorSearchIndex();
    const db = client.db(INVENTORY_DATABASE);
    const collection = db.collection(ITEMS_COLLECTION);

    await collection.deleteMany({});
    console.log('Cleared existing data from items collection');

    const synthenticData = await generateSynthenticData();

    const recordsWithSummaries = await Promise.all(
      synthenticData.map(async (record) => ({
        pageContent: await createItemSummary(record),
        metadata: { ...record },
      })),
    );

    for (const record of recordsWithSummaries) {
      await MongoDBAtlasVectorSearch.fromDocuments(
        [record],
        new GoogleGenerativeAIEmbeddings({
          modelName: 'gemini-embedding-001',
          apiKey: process.env.GOOGLE_API_KEY,
        }),
        {
          collection,
          indexName: 'vector_index',
          embeddingKey: 'embedding',
        },
      );
      console.log('Successfully processed & saved record:', record.metadata.item_id);
      await new Promise((res) => setTimeout(res, 5000)); // 5s delay between requests
      console.log('Waiting for  5 seconds before processing the next record...');
    }

    console.log('Database seeding completed');
  } catch (error) {
    console.error('Error sedding database', error);
  } finally {
    await client.close();
  }
}

seedDatabase().catch(console.error);
