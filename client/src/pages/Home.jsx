import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money } from '../api';
import { useShop } from '../App';

function Stars({ value }) {
  const full = Math.round(value);
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      {'★'.repeat(full)}
      {'☆'.repeat(5 - full)}
    </span>
  );
}

export default function Home() {
  const { user, refreshCart } = useShop();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [addedId, setAddedId] = useState('');

  useEffect(() => {
    document.title = 'Shop · Northline';
  }, []);

  useEffect(() => {
    let active = true;
    api('/api/products')
      .then((data) => {
        if (active) setProducts(data.products);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setQty(1);
  }, [selected]);

  const categories = useMemo(() => {
    return ['All', ...new Set(products.map((product) => product.category))];
  }, [products]);

  const visible = products.filter((product) => {
    const haystack = `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase();
    const matchesQuery = haystack.includes(query.trim().toLowerCase());
    const matchesCategory = category === 'All' || product.category === category;
    return matchesQuery && matchesCategory;
  });

  async function add(product, amount = 1) {
    if (!user) {
      navigate('/signin');
      return;
    }
    setBusyId(product._id);
    setError('');
    try {
      await api('/api/cart', { method: 'POST', body: { productId: product._id, qty: amount } });
      await refreshCart();
      setAddedId(product._id);
      setSelected(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">The house edit</p>
          <h1>Objects with weight, wear, and a reason to stay.</h1>
          <p className="lede">
            Twelve pieces in regular stock — audio, wool, stoneware, and shoes you can actually walk in.
          </p>
        </div>
        <label className="search">
          Search
          <input
            value={query}
            placeholder="Try lamp, wool, runner"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </header>

      <div className="filters" role="tablist">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={item === category ? 'chip on' : 'chip'}
            aria-pressed={item === category}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {error && <p className="banner">{error}</p>}
      {loading && <p className="status">Loading the shop…</p>}
      {!loading && visible.length === 0 && <p className="status">Nothing matches that search.</p>}

      <section className="grid">
        {visible.map((product) => (
          <article key={product._id} className="card" onClick={() => setSelected(product)}>
            <img src={product.image} alt={product.name} />
            <div className="card-body">
              <p className="meta">
                {product.brand} · {product.category}
              </p>
              <h2>{product.name}</h2>
              <p className="rating">
                <Stars value={product.rating} />
                <span>
                  {product.rating} · {product.reviews} reviews
                </span>
              </p>
              <div className="card-row">
                <strong>{money(product.price)}</strong>
                <button
                  type="button"
                  className="btn"
                  disabled={busyId === product._id || product.stock < 1}
                  onClick={(event) => {
                    event.stopPropagation();
                    add(product, 1);
                  }}
                >
                  {product.stock < 1 ? 'Sold out' : addedId === product._id ? 'Added' : 'Add'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-title"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={selected.image} alt={selected.name} />
            <div className="modal-body">
              <button type="button" className="close" onClick={() => setSelected(null)}>
                Close
              </button>
              <p className="meta">
                {selected.brand} · {selected.category}
              </p>
              <h2 id="product-title">{selected.name}</h2>
              <p className="rating">
                <Stars value={selected.rating} />
                <span>
                  {selected.rating} · {selected.reviews} reviews
                </span>
              </p>
              <p className="desc">{selected.description}</p>
              <p className="stock">{selected.stock} in stock · ships in 2–4 days</p>
              <div className="card-row">
                <strong className="price">{money(selected.price)}</strong>
                <div className="qty">
                  <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))}>
                    −
                  </button>
                  <span>{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((value) => Math.min(selected.stock, value + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="btn wide"
                disabled={busyId === selected._id || selected.stock < 1}
                onClick={() => add(selected, qty)}
              >
                {busyId === selected._id ? 'Adding…' : 'Add to cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
