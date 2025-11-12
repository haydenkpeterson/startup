const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const configPath = path.resolve(__dirname, 'dbConfig.json');
let config;

try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (err) {
  console.error(`Failed to read MongoDB config at ${configPath}:`, err.message);
  process.exit(1);
}

const connectionUrl = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const dbName = config.dbName ?? 'auditapp';
const usersCollectionName = config.userCollection ?? 'users';
const auditsCollectionName = config.auditCollection ?? 'audits';

const client = new MongoClient(connectionUrl);

let dbPromise = null;
let usersCollection;
let auditsCollection;

async function connect() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    await client.connect();
    const db = client.db(dbName);
    usersCollection = db.collection(usersCollectionName);
    auditsCollection = db.collection(auditsCollectionName);
    await db.command({ ping: 1 });
    console.log('Connected to MongoDB cluster');
    return db;
  })().catch((err) => {
    console.error(`Unable to connect to MongoDB at ${connectionUrl} because ${err.message}`);
    process.exit(1);
  });

  return dbPromise;
}

async function ensureConnection() {
  if (!dbPromise) {
    await connect();
  } else {
    await dbPromise;
  }
}

async function getUserByEmail(email) {
  if (!email) return null;
  await ensureConnection();
  return usersCollection.findOne({ email });
}

async function getUserByUsername(username) {
  if (!username) return null;
  await ensureConnection();
  return usersCollection.findOne({ username });
}

async function getUserByToken(token) {
  if (!token) return null;
  await ensureConnection();
  return usersCollection.findOne({ token });
}

async function addUser(user) {
  await ensureConnection();
  const result = await usersCollection.insertOne(user);
  return { ...user, _id: result.insertedId };
}

async function setUserToken(userId, token) {
  if (!userId) return;
  await ensureConnection();
  await usersCollection.updateOne({ _id: userId }, { $set: { token } });
}

async function clearUserToken(token) {
  if (!token) return;
  await ensureConnection();
  await usersCollection.updateOne({ token }, { $unset: { token: '' } });
}

async function addAuditRecord(auditRecord) {
  await ensureConnection();
  await auditsCollection.insertOne(auditRecord);
  return auditRecord;
}

async function getAuditsForUser(username) {
  if (!username) return [];
  await ensureConnection();
  return auditsCollection.find({ username }).sort({ createdAt: 1, _id: 1 }).toArray();
}

module.exports = {
  getUserByEmail,
  getUserByUsername,
  getUserByToken,
  addUser,
  setUserToken,
  clearUserToken,
  addAuditRecord,
  getAuditsForUser,
};
