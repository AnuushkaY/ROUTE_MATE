import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Auth from './pages/Auth';
import Home from './pages/Home';
import CreatePool from './pages/CreatePool';
import PoolChat from './pages/PoolChat';
import Profile from './pages/Profile';
import Security from './pages/Security';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Failed to load auth session', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex container items-center justify-center" style={{height: '100vh'}}>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <div className="navbar">
        <Link to="/" className="logo">ROUTEMATE</Link>
        <div className="flex gap-4 items-center">
          {session ? (
            <>
              <Link to="/" style={{ color: 'var(--text-main)' }}>Home</Link>
              <Link to="/profile" style={{ color: 'var(--text-main)' }}>Profile</Link>
              <Link to="/security" style={{ color: 'var(--text-main)' }}>Security Rules</Link>
              <button className="btn btn-outline" onClick={() => supabase.auth.signOut()} style={{ padding: '8px 16px' }}>
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/security" style={{ color: 'var(--text-main)' }}>Safety Protocols</Link>
          )}
        </div>
      </div>
      
      <Routes>
        <Route path="/" element={session ? <Home /> : <Navigate to="/auth" />} />
        <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
        <Route path="/create-pool" element={session ? <CreatePool /> : <Navigate to="/auth" />} />
        <Route path="/chat/:poolId" element={session ? <PoolChat /> : <Navigate to="/auth" />} />
        <Route path="/profile" element={session ? <Profile /> : <Navigate to="/auth" />} />
        <Route path="/security" element={<Security />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
