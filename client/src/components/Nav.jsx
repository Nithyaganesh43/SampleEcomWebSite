import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../App';

export default function Nav() {
  const { user, cartCount, signOut } = useShop();
  const navigate = useNavigate();

  function onSignOut() {
    signOut();
    navigate('/');
  }

  return (
    <header className="nav">
      <Link to="/" className="logo">
        Northline
      </Link>
      <nav>
        <Link to="/">Shop</Link>
        <Link to="/cart" className="cart-link">
          Cart <span className="badge">{cartCount}</span>
        </Link>
        {user ? (
          <>
            <span className="who">{user.name}</span>
            <button type="button" className="btn ghost" onClick={onSignOut}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/signin">Sign in</Link>
            <Link to="/signup" className="btn">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
