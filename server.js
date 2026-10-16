require('dotenv').config({ path: ['.env', 'atlas-credentials.env'], quiet: true });
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'M01034688';

app.use(cors());
app.use(express.json());

let db;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: db ? 'connected' : 'disconnected' });
});

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

const parseId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

app.get('/api/lessons', wrap(async (req, res) => {
  res.json(await db.collection('lessons').find().toArray());
}));

app.get('/api/search', wrap(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json(await db.collection('lessons').find().toArray());
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(escaped, 'i');
  const or = [{ subject: rx }, { location: rx }];
  if (!Number.isNaN(Number(q))) or.push({ price: Number(q) }, { spaces: Number(q) });
  res.json(await db.collection('lessons').find({ $or: or }).toArray());
}));

app.put('/api/lessons/:id', wrap(async (req, res) => {
  const _id = parseId(req.params.id);
  if (!_id) return res.status(400).json({ error: 'Invalid lesson id' });
  const update = { ...req.body };
  delete update._id;
  if (Object.keys(update).length === 0) return res.status(400).json({ error: 'No fields to update' });
  const result = await db.collection('lessons').updateOne({ _id }, { $set: update });
  if (!result.matchedCount) return res.status(404).json({ error: 'Lesson not found' });
  res.json({ message: 'Lesson updated' });
}));

app.post('/api/orders', wrap(async (req, res) => {
  const { name, phone, lessonIDs } = req.body || {};
  if (typeof name !== 'string' || !/^[A-Za-z\s'-]+$/.test(name.trim())) {
    return res.status(400).json({ error: 'Invalid name' });
  }
  if (typeof phone !== 'string' || !/^\+?[0-9\s-]{6,20}$/.test(phone.trim())) {
    return res.status(400).json({ error: 'Invalid phone' });
  }
  if (!Array.isArray(lessonIDs) || lessonIDs.length === 0) {
    return res.status(400).json({ error: 'lessonIDs must be a non-empty array' });
  }
  const order = { name: name.trim(), phone: phone.trim(), lessonIDs, createdAt: new Date() };
  const result = await db.collection('orders').insertOne(order);
  res.status(201).json({ _id: result.insertedId, ...order });
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

async function start() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`Connected to MongoDB database "${DB_NAME}"`);
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
