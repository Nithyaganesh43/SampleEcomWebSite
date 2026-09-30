const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mong oose');
const { requireAuth, sign } = require('./auth');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
const router = express.Router();

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

// CREATE — register
router.post('/signup', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || !email || !email.includes('@')) {
      return res.status(400).json({ message: 'Name and a valid email are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: passwordHash });
    res.status(201).json({ user: publicUser(user), token: sign(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Email already registered' });
    console.error(err);
    res.status(500).json({ message: 'Could not create account' });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }
    res.json({ user: publicUser(user), token: sign(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not sign in' });
  }
});

// READ
router.get('/', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: publicUser(user) });
});

// UPDATE
router.put('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ message: 'Name is required' });
      user.name = name;
    }
    if (req.body.password) {
      const password = String(req.body.password);
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      user.password = await bcrypt.hash(password, 10);
    }
    await user.save();
    res.json({ user: publicUser(user), token: sign(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update account' });
  }
});

// DELETE
router.delete('/', requireAuth, async (req, res) => {
  try {
    const Cart = mongoose.model('Cart');
    await Cart.deleteOne({ user: req.user.id });
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete account' });
  }
});

module.exports = router;
