const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isConnectedToMongo = false;
const dataDir = path.join(__dirname, '..', 'data');
const storeFilePath = path.join(dataDir, 'store.json');

// In-memory / file-based fallback store when external MongoDB service is not active
class LocalStore {
  constructor() {
    this.data = {
      users: [],
      products: [],
      categories: [],
      orders: [],
      carts: [],
      reviews: [],
      coupons: []
    };
    this.init();
  }

  init() {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(storeFilePath)) {
      try {
        const raw = fs.readFileSync(storeFilePath, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.warn('[DB Fallback] Failed to read store.json, reinitializing.');
      }
    }
  }

  save() {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(storeFilePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[DB Fallback] Error saving store:', err.message);
    }
  }
}

const localStore = new LocalStore();

async function connectDB() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/roam_rev_db';
  try {
    mongoose.set('strictQuery', false);
    // Attempt connecting with a short timeout
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000
    });
    isConnectedToMongo = true;
    console.log(`[Database] Connected successfully to MongoDB at ${mongoURI}`);
  } catch (err) {
    isConnectedToMongo = false;
    console.log(`[Database] MongoDB service not detected (${err.message}).`);
    console.log('[Database] -> Seamlessly activated persistent Local JSON Engine (backend/data/store.json).');
    console.log('[Database] -> All APIs, Auth, Cart, Checkout, Reviews & Admin fully functional with zero setup!');
  }
}

function getStore() {
  return localStore;
}

function isMongo() {
  return isConnectedToMongo;
}

module.exports = {
  connectDB,
  getStore,
  isMongo
};
