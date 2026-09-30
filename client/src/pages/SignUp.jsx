import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useShop } from '../App';

export default function SignUp() {
  const { signIn } = useShop();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Sign up · Northline';
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const session = await api('/api/users/signup', {
        method: 'POST',
        body: { name, email, password },
      });
      signIn(session);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth-brand">
        <p className="eyebrow">Join Northline</p>
        <h1>A short list of things worth keeping.</h1>
        <p>Create an account to save a cart and come back to it. No newsletter, no extra steps.</p>
      </section>
      <form className="auth-card" onSubmit={onSubmit}>
        <h2>Create account</h2>
        <label>
          Name
          <input
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn wide" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="switch">
          Already registered? <Link to="/signin">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
