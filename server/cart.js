const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('./auth');

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        qty: { type: Number, required: true, min: 1 },
      },
    ],
  },
  { timestamps: true }
);

const Cart = mongoose.model('Cart', cartSchema);
const router = express.Router();

function lineTotal(price, qty) {
  return Math.round(price * qty * 100) / 100;
}

async function present(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  const dangling = cart.items.some((item) => !item.product);
  if (dangling) {
    cart.items = cart.items.filter((item) => item.product);
    await cart.save();
  }
  const items = cart.items.map((item) => ({
    product: item.product,
    qty: item.qty,
    lineTotal: lineTotal(item.product.price, item.qty),
  }));
  const total = Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
  return { items, total };
}

// READ
router.get('/', requireAuth, async (req, res) => {
  try {
    res.json(await present(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load cart' });
  }
});

// CREATE — add a product, or increase quantity if it is already in the cart
router.post('/', requireAuth, async (req, res) => {
  try {
    const productId = req.body.productId;
    const qty = Number(req.body.qty || 1);
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }
    const Product = mongoose.model('Product');
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });
    const existing = cart.items.find((item) => item.product.toString() === productId);
    const nextQty = (existing ? existing.qty : 0) + qty;
    if (nextQty > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} in stock` });
    }
    if (existing) existing.qty = nextQty;
    else cart.items.push({ product: productId, qty });
    await cart.save();
    res.status(201).json(await present(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not add to cart' });
  }
});

// UPDATE — set quantity for one product
router.put('/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const qty = Number(req.body.qty);
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }
    const Product = mongoose.model('Product');
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (qty > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} in stock` });
    }
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart is empty' });
    const item = cart.items.find((entry) => entry.product.toString() === productId);
    if (!item) return res.status(404).json({ message: 'Item is not in the cart' });
    item.qty = qty;
    await cart.save();
    res.json(await present(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update cart' });
  }
});

// DELETE entire cart
router.delete('/', requireAuth, async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] }, { upsert: true });
    res.json(await present(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not clear cart' });
  }
});

// DELETE one product from the cart
router.delete('/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = cart.items.filter((item) => item.product.toString() !== productId);
      await cart.save();
    }
    res.json(await present(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not remove item' });
  }
});

module.exports = router;
