const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('./auth');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, default: '', trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    stock: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
const router = express.Router();

const catalog = [
  {
    name: 'Aero Wireless Headphones',
    brand: 'Fieldcast',
    category: 'Audio',
    price: 189,
    rating: 4.7,
    reviews: 412,
    stock: 22,
    description:
      'Over-ear headphones with a 30-hour battery and dense memory-foam cups. The tuning stays warm on music and clear on calls, and the hinge folds flat into a commuter bag.',
  },
  {
    name: 'Harbor Steel Bottle',
    brand: 'Kestrel',
    category: 'Outdoors',
    price: 34,
    rating: 4.5,
    reviews: 860,
    stock: 40,
    description:
      'A 20 oz double-wall bottle that holds ice through a workday. The powder-coated body shrugs off drops and the leak-proof cap opens with one hand.',
  },
  {
    name: 'Meridian Knit Runner',
    brand: 'Northline',
    category: 'Footwear',
    price: 128,
    rating: 4.4,
    reviews: 219,
    stock: 15,
    description:
      'A lightweight trainer with a knit upper and a cushioned foam midsole. Built for city miles, with a rubber outsole that grips wet pavement.',
  },
  {
    name: 'Arc Task Lamp',
    brand: 'Holst',
    category: 'Home',
    price: 96,
    rating: 4.8,
    reviews: 143,
    stock: 12,
    description:
      'A matte aluminum desk lamp with a dimmable LED head and a low, steady base. The arm reaches across a desk without tipping when you swing it.',
  },
  {
    name: 'Coast Weekender',
    brand: 'Atelier Mar',
    category: 'Bags',
    price: 168,
    rating: 4.6,
    reviews: 97,
    stock: 9,
    description:
      'Waxed canvas holdall with a leather grab handle and a shoe pocket under the base. It fits a weekend of clothes without looking like luggage.',
  },
  {
    name: 'Solace Wool Throw',
    brand: 'Bramble',
    category: 'Home',
    price: 82,
    rating: 4.9,
    reviews: 256,
    stock: 20,
    description:
      'A brushed merino throw, loosely woven so it drapes instead of bunching. Washes cold and gets softer after the first week on a sofa.',
  },
  {
    name: 'Drift Automatic Watch',
    brand: 'Sable',
    category: 'Accessories',
    price: 246,
    rating: 4.3,
    reviews: 74,
    stock: 7,
    description:
      'A 38 mm field watch with a sapphire crystal and a 40-hour automatic movement. The leather strap is unlined at the edges so it breaks in quickly.',
  },
  {
    name: 'Alto Rib Beanie',
    brand: 'Northline',
    category: 'Apparel',
    price: 28,
    rating: 4.6,
    reviews: 510,
    stock: 35,
    description:
      'Mid-weight merino rib knit that sits close without itching. Fold the cuff once in mild weather, or pull it down when the wind picks up.',
  },
  {
    name: 'Kinetic Grip Mat',
    brand: 'Forma',
    category: 'Outdoors',
    price: 54,
    rating: 4.5,
    reviews: 188,
    stock: 26,
    description:
      'A 5 mm natural-rubber mat with alignment marks and a closed-cell surface that stays put on wood floors. It rolls tight and wipes clean.',
  },
  {
    name: 'Cove Mug Pair',
    brand: 'Kiln & Co',
    category: 'Home',
    price: 38,
    rating: 4.7,
    reviews: 640,
    stock: 30,
    description:
      'Two stoneware mugs with a speckled glaze and a foot that does not scuff a table. Each holds 12 oz and is dishwasher safe.',
  },
  {
    name: 'Ledger Card Wallet',
    brand: 'Sable',
    category: 'Accessories',
    price: 46,
    rating: 4.4,
    reviews: 155,
    stock: 18,
    description:
      'Vegetable-tanned leather, four card slots, and a center pocket for folded notes. It thins out as the leather burnishes in a front pocket.',
  },
  {
    name: 'Loom Seat Pad',
    brand: 'Bramble',
    category: 'Home',
    price: 64,
    rating: 4.2,
    reviews: 89,
    stock: 14,
    description:
      'A dense cotton seat pad with ties for a wooden chair. The cover zips off, and the fill keeps its shape after a season of daily use.',
  },
];

function fallbackImage(name) {
  const seed = encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
  return `https://picsum.photos/seed/${seed}/800/800`;
}

async function seedProducts() {
  const count = await Product.countDocuments();
  if (count > 0) return;
  let photos = [];
  try {
    const response = await fetch('https://picsum.photos/v2/list?page=2&limit=12');
    if (response.ok) photos = await response.json();
  } catch (err) {
    console.log('Picsum image API unavailable, using fallback image URLs');
  }
  const docs = catalog.map((item, index) => ({
    ...item,
    image: photos[index]
      ? `https://picsum.photos/id/${photos[index].id}/800/800`
      : fallbackImage(item.name),
  }));
  await Product.insertMany(docs);
  console.log(`Seeded ${docs.length} products`);
}

function readProduct(body, { partial } = {}) {
  const value = {};
  const textFields = ['name', 'brand', 'category', 'description', 'image'];
  for (const field of textFields) {
    if (body[field] !== undefined) value[field] = String(body[field]).trim();
  }
  if (body.price !== undefined) value.price = Number(body.price);
  if (body.stock !== undefined) value.stock = Number(body.stock);
  if (body.rating !== undefined) value.rating = Number(body.rating);
  if (body.reviews !== undefined) value.reviews = Number(body.reviews);

  if (!partial) {
    if (!value.name || !value.category || !value.description || !value.image) {
      return { error: 'Name, category, description, and image are required' };
    }
    if (value.price === undefined || value.stock === undefined) {
      return { error: 'Price and stock are required' };
    }
  }
  if (value.price !== undefined && (!Number.isFinite(value.price) || value.price < 0)) {
    return { error: 'Price must be zero or more' };
  }
  if (value.stock !== undefined && (!Number.isInteger(value.stock) || value.stock < 0)) {
    return { error: 'Stock must be a whole number' };
  }
  return { value };
}

// READ all
router.get('/', async (req, res) => {
  const products = await Product.find().sort({ createdAt: 1 });
  res.json({ products });
});

// READ one
router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid product id' });
  }
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ product });
});

// CREATE
router.post('/', requireAuth, async (req, res) => {
  try {
    const parsed = readProduct(req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    const product = await Product.create(parsed.value);
    res.status(201).json({ product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create product' });
  }
});

// UPDATE
router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const parsed = readProduct(req.body, { partial: true });
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    const product = await Product.findByIdAndUpdate(req.params.id, parsed.value, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update product' });
  }
});

// DELETE
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete product' });
  }
});

module.exports = { router, seedProducts };

