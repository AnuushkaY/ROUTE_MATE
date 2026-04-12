import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import Auth from './pages/Auth';
import Dashboard from './pages/Home';
import CreatePool from './pages/CreatePool';
import PoolChat from './pages/PoolChat';
import Profile from './pages/Profile';
import Security from './pages/Security';
import HowItWorks from './pages/HowItWorks';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

function AppContent() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

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
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="w-16 h-16 border-4 border-gray-100 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-[#121212] font-black tracking-widest text-xs uppercase animate-pulse">Initializing RouteMate...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <Navbar session={session} compact={location.pathname === '/'} />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
          <Route path="/create-pool" element={session ? <CreatePool /> : <Navigate to="/auth" />} />
          <Route path="/chat/:poolId" element={session ? <PoolChat /> : <Navigate to="/auth" />} />
          <Route path="/profile" element={session ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/security" element={<Security />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
