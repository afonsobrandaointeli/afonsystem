const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/afonsystem';
let db;

async function connectDB() {
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  console.log('[DB] Connected to MongoDB:', uri);
  return db;
}

function getDB() {
  if (!db) throw new Error('Database not connected. Call connectDB() first.');
  return db;
}

async function closeDB() {
  if (db) {
    await db.client.close();
    db = null;
  }
}

module.exports = { connectDB, getDB, closeDB };
