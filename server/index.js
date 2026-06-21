const db = require('./db');
const PORT = process.env.PORT || 3001;

db.setup()
  .then(() => {
    const app = require('./app');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database setup failed:', err);
    process.exit(1);
  });
