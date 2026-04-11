import { motion } from 'framer-motion';
import { Users, Clock, ArrowRight, User, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PoolCardProps {
  pool: any;
  compact?: boolean;
}

const PoolCard = ({ pool, compact = false }: PoolCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.01, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.98 }}
      className={`group relative bg-white rounded-3xl border border-gray-100 p-6 flex flex-col gap-6 cursor-pointer transition-all duration-300 ${compact ? 'p-4 rounded-2xl' : ''}`}
      onClick={() => navigate(`/chat/${pool.id}`)}
    >
      {/* Price Badge */}
      <div className="absolute top-6 right-6 px-4 py-2 bg-[#121212] text-[#FFC107] rounded-2xl font-black text-lg shadow-lg">
        ₹{pool.price_per_seat}
      </div>

      {/* Creator Info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#FFC107]/20 rounded-full flex items-center justify-center overflow-hidden border-2 border-primary/50">
          <User className="text-[#FFC107]" size={24} />
        </div>
        <div>
          <h4 className="font-black text-[#121212] leading-tight">{pool.creator_name || 'Verified Captain'}</h4>
          <div className="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-tighter">
            <Star size={12} className="fill-primary text-[#FFC107]" />
            <span>4.9 • Superhost</span>
          </div>
        </div>
      </div>

      {/* Route Info */}
      <div className="flex flex-col gap-3 relative">
        {/* Connecting Line */}
        <div className="absolute left-[11px] top-[24px] bottom-[24px] w-0.5 border-l-2 border-dashed border-gray-200" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-6 h-6 rounded-full bg-[#121212] border-4 border-white shadow-sm flex items-center justify-center" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase">From</span>
            <span className="text-sm font-bold text-[#121212] truncate">{pool.start_location}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-6 h-6 rounded-full bg-[#FFC107] border-4 border-white shadow-sm flex items-center justify-center" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase">To</span>
            <span className="text-sm font-bold text-[#121212] truncate">{pool.end_location}</span>
          </div>
        </div>
      </div>

      {/* Meta Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold text-xs text-gray-500">
            <Clock size={14} className="text-[#FFC107]" />
            <span>{pool.start_time || '09:00 AM'}</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-xs text-gray-500">
            <Users size={14} className="text-[#FFC107]" />
            <span>{pool.available_seats} Seats</span>
          </div>
        </div>

        <div className="p-2 bg-[#FFC107] rounded-xl group-hover:bg-[#121212] group-hover:text-[#FFC107] transition-colors">
          <ArrowRight size={18} />
        </div>
      </div>

      {/* Decorative Glow */}
      <div className="absolute inset-0 rounded-3xl bg-[#FFC107]/0 group-hover:bg-[#FFC107]/[0.02] pointer-events-none transition-colors duration-500" />
    </motion.div>
  );
};

export default PoolCard;
