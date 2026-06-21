require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const db = require('./db');

const app = express();

app.use(express.json());

// Ensure DB tables exist and are seeded on every cold start (idempotent)
let dbReady = null;
app.use(async (req, res, next) => {
  if (!dbReady) dbReady = db.setup().catch(err => { dbReady = null; throw err; });
  try {
    await dbReady;
    next();
  } catch (err) {
    console.error('DB setup failed:', err);
    res.status(503).json({ success: false, data: null, error: 'Database unavailable' });
  }
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

app.use('/api/flaky-tests', require('./routes/flaky-tests'));
app.use('/api/test-cases/import', require('./routes/test-case-import'));
app.use('/api/test-cases', require('./routes/test-cases'));
app.use('/api/suites', require('./routes/suites'));
app.use('/api/bugs', require('./routes/bugs'));
app.use('/api/test-runs', require('./routes/test-runs'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/search', require('./routes/search'));

module.exports = app;
