import { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { api, clearSession, getSession, saveSession } from './api';
import Nav from './components/Nav';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Cart from './pages/Cart';

const ShopContext = createContext(null);

export function useShop() {
  return useContext(ShopContext);
}

export default function App() {
  const [user, setUser] = useState(() => getSession());
  const [cartCount, setCartCount] = useState(0);

  async function refreshCart() {
    if (!localStorage.getItem('token')) {
      setCartCount(0);
      return;
    }
    try {
      const cart = await api('/api/cart');
      setCartCount(cart.items.reduce((sum, item) => sum + item.qty, 0));
    } catch (err) {
      setCartCount(0);
    }
  }

  useEffect(() => {
    refreshCart();
  }, [user]);

  function signIn(session) {
    saveSession(session);
    setUser(session.user);
  }

  function signOut() {
    clearSession();
    setUser(null);
    setCartCount(0);
  }

  return (
    <ShopContext.Provider value={{ user, cartCount, refreshCart, signIn, signOut }}>
      <BrowserRouter>
        <div className="shell">
          <Nav />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={user ? <Navigate to="/" /> : <SignIn />} />
            <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp />} />
            <Route path="/cart" element={user ? <Cart /> : <Navigate to="/signin" />} />
          </Routes>
          <footer className="foot">thank you</footer>
        </div>
      </BrowserRouter>
    </ShopContext.Provider>
  );
}
