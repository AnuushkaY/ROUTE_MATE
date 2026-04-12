import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, User, Menu } from 'lucide-react';

/** Side-profile four-door sedan (facing right), yellow fill — matches nav black square */
function SedanLogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 60 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        fill="#FFC107"
        d="M1.5 18.2V13.4l2.9-2.3h5.8l3.5-2.7c.55-.42 1.25-.65 1.95-.65h24.7c.75 0 1.45.25 2.05.68l3.4 2.67h5.9l2.85 2.32v4.8H1.5z"
      />
      <path
        fill="#121212"
        fillOpacity="0.35"
        d="M10.5 11.4l4.8-.5 23.8-.4 5.6.75 1.75 2.15-2 .45H12.4l-1.9-2.45z"
      />
      <path
        fill="#121212"
        fillOpacity="0.2"
        d="M23.2 9.6h13.6c.4 0 .78.1 1.1.3l1.35.95H21.8l1.2-1.05c.32-.28.72-.2 1.2-.2z"
      />
      <circle cx="14.2" cy="18.4" r="3.25" fill="#121212" />
      <circle cx="14.2" cy="18.4" r="1.25" fill="#9CA3AF" />
      <circle cx="45.8" cy="18.4" r="3.25" fill="#121212" />
      <circle cx="45.8" cy="18.4" r="1.25" fill="#9CA3AF" />
      <path
        fill="#121212"
        fillOpacity="0.45"
        d="M51.2 13.4h2c.32 0 .58.25.58.55v1c0 .18-.14.34-.34.34h-1.7l-.54-1.9zM3.8 13.35h1.75c.2 0 .36.16.36.36v1.25c0 .2-.16.36-.36.36H3.3l.5-1.97z"
      />
    </svg>
  );
}

const Navbar = ({ session, compact = false }: { session: any; compact?: boolean }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`sticky top-0 z-50 w-full bg-white/80 backdrop-blur-lg border-b border-gray-100 px-6 ${compact ? 'py-2.5' : 'py-4'}`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-[#121212] flex items-center justify-center rounded-xl transform group-hover:rotate-12 transition-transform duration-300">
            <SedanLogoMark className="w-[30px] h-[12px] shrink-0" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-[#121212]">
            Route<span className="text-[#FFC107]">Mate</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-bold text-gray-500 hover:text-[#121212] transition-colors">Dashboard</Link>
          <Link to="/security" className="text-sm font-bold text-gray-500 hover:text-[#121212] transition-colors">Safety Center</Link>
          <Link to="/how-it-works" className="text-sm font-bold text-gray-500 hover:text-[#121212] transition-colors">How it works</Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm hover:bg-white hover:shadow-lg transition-all"
              >
                <User size={18} />
                <span>Profile</span>
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="btn-primary"
            >
              Get Started
            </button>
          )}
        </div>

        {/* Mobile Menu Icon (Visual only, BottomNav handles navigation) */}
        <div className="md:hidden">
          <div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg">
            <Menu size={20} className="text-[#121212]" />
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
