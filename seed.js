require('dotenv').config({ path: ['.env', 'atlas-credentials.env'], quiet: true });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'M01034688';

const lessons = [
  { subject: 'Math', location: 'London', price: 100, spaces: 5 },
  { subject: 'English', location: 'Manchester', price: 80, spaces: 5 },
  { subject: 'Physics', location: 'Leeds', price: 120, spaces: 5 },
  { subject: 'Chemistry', location: 'London', price: 110, spaces: 5 },
  { subject: 'Music', location: 'Bristol', price: 90, spaces: 5 },
  { subject: 'Art', location: 'Oxford', price: 70, spaces: 5 },
  { subject: 'History', location: 'York', price: 85, spaces: 5 },
  { subject: 'Biology', location: 'Cambridge', price: 105, spaces: 5 },
  { subject: 'Computing', location: 'Birmingham', price: 130, spaces: 5 },
  { subject: 'Drama', location: 'Liverpool', price: 75, spaces: 5 }
];

(async () => {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const col = client.db(DB_NAME).collection('lessons');
    if ((await col.countDocuments()) > 0) {
      console.log('lessons collection already has data; skipping seed');
    } else {
      const r = await col.insertMany(lessons);
      console.log(`Inserted ${r.insertedCount} lessons`);
    }
  } finally {
    await client.close();
  }
})().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
