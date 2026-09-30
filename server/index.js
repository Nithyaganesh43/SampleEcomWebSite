const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const userRoutes = require('./users');
const { router: productRoutes, seedProducts } = require('./products');
const cartRoutes = require('./cart');

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error('Missing MONGO_URI or JWT_SECRET in .env');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 5000;
const dist = path.join(__dirname, '..', 'client', 'dist');

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use(express.static(dist));
app.get('*', (req, res) => {
  const indexFile = path.join(dist, 'index.html');
  if (!fs.existsSync(indexFile)) {
    return res
      .status(503)
      .type('text')
      .send('Frontend is not built yet. From the project root run: npm run build');
  }
  res.sendFile(indexFile);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    await seedProducts();
    app.listen(port, '0.0.0.0', () => {
      console.log(`Northline running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });


