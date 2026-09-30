import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api';
import { useShop } from '../App';

export default function Cart() {
  const { refreshCart } = useShop();
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    document.title = 'Cart · Northline';
  }, []);

  async function load() {
    const data = await api('/api/cart');
    setCart(data);
    await refreshCart();
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function updateQty(productId, qty) {
    setBusy(productId);
    setError('');
    try {
      const data = await api(`/api/cart/${productId}`, { method: 'PUT', body: { qty } });
      setCart(data);
      await refreshCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  async function remove(productId) {
    setBusy(productId);
    setError('');
    try {
      const data = await api(`/api/cart/${productId}`, { method: 'DELETE' });
      setCart(data);
      await refreshCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  async function placeOrder() {
    setBusy('order');
    setError('');
    try {
      const data = await api('/api/cart', { method: 'DELETE' });
      setCart(data);
      await refreshCart();
      setPlaced(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  const items = cart?.items || [];

  return (
    <main className="page">
      <header className="hero slim">
        <div>
          <p className="eyebrow">Your cart</p>
          <h1>Ready when you are.</h1>
        </div>
      </header>

      {error && <p className="banner">{error}</p>}
      {placed && <p className="banner ok">Order placed. A receipt would land here in a fuller shop.</p>}
      {!cart && !error && <p className="status">Loading cart…</p>}

      {cart && items.length === 0 && (
        <div className="empty">
          <p>Nothing in the cart yet.</p>
          <Link to="/" className="btn">
            Browse the shop
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <section className="cart-layout">
          <ul className="cart-list">
            {items.map((item) => (
              <li key={item.product._id}>
                <img src={item.product.image} alt="" />
                <div>
                  <p className="meta">{item.product.brand}</p>
                  <h2>{item.product.name}</h2>
                  <p className="stock">{money(item.product.price)} each</p>
                  <button
                    type="button"
                    className="text-btn"
                    disabled={busy === item.product._id}
                    onClick={() => remove(item.product._id)}
                  >
                    Remove
                  </button>
                </div>
                <div className="qty">
                  <button
                    type="button"
                    disabled={busy === item.product._id || item.qty <= 1}
                    onClick={() => updateQty(item.product._id, item.qty - 1)}
                  >
                    −
                  </button>
                  <span>{item.qty}</span>
                  <button
                    type="button"
                    disabled={busy === item.product._id || item.qty >= item.product.stock}
                    onClick={() => updateQty(item.product._id, item.qty + 1)}
                  >
                    +
                  </button>
                </div>
                <strong>{money(item.lineTotal)}</strong>
              </li>
            ))}
          </ul>
          <aside className="summary">
            <h2>Summary</h2>
            <p>
              <span>Items</span>
              <span>{items.reduce((sum, item) => sum + item.qty, 0)}</span>
            </p>
            <p>
              <span>Shipping</span>
              <span>Free</span>
            </p>
            <p className="total">
              <span>Total</span>
              <span>{money(cart.total)}</span>
            </p>
            <button type="button" className="btn wide" disabled={busy === 'order'} onClick={placeOrder}>
              {busy === 'order' ? 'Placing order…' : 'Place order'}
            </button>
          </aside>
        </section>
      )}
    </main>
  );
}
