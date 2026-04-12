import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  MapPinned,
  Car,
  MessageCircle,
  Wallet,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: 'Create your profile',
    text: 'Sign up with email or phone and verify in seconds. Add a name and a few basics so hosts and riders know they are talking to a real person.',
  },
  {
    step: 2,
    icon: MapPinned,
    title: 'Search your route',
    text: 'Enter where you are leaving from and where you are headed, plus date and time. We show pools on a map and in a list so you can see what fits your commute.',
  },
  {
    step: 3,
    icon: Car,
    title: 'Join a pool or host one',
    text: 'Found a match? Hop in. No ride yet? Host a pool, set seats and a fair share per seat, and let others request to join along your route.',
  },
  {
    step: 4,
    icon: MessageCircle,
    title: 'Coordinate in chat',
    text: 'Use pool chat to agree on pickup spots and timing without handing out your number until you are comfortable. Everyone stays in the loop in one place.',
  },
  {
    step: 5,
    icon: Wallet,
    title: 'Share the ride, split the cost',
    text: 'Carpooling is about saving fuel and money together. Prices are shown up front per seat so you know what to expect before you commit.',
  },
];

const HowItWorks = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white"
    >
      <div className="container mx-auto px-6 py-16 md:py-24 max-w-3xl">
        <div className="text-center mb-16 md:mb-20">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFC107]/15 border border-primary/25 text-[#121212] rounded-2xl mb-6"
          >
            <Sparkles size={16} className="text-[#FFC107]" />
            <span className="text-[10px] font-black uppercase tracking-widest">RouteMate</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black text-[#121212] tracking-tighter mb-6 italic">
            How it <span className="text-[#FFC107]">works</span>
          </h1>
          <p className="text-gray-500 font-bold text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            RouteMate connects people who share similar trips so you can ride together, spend less, and
            ease traffic—without the awkwardness of random group chats.
          </p>
        </div>

        <ol className="space-y-10 md:space-y-12">
          {steps.map((item, idx) => (
            <motion.li
              key={item.step}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.06 }}
              className="flex gap-5 md:gap-8"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#121212] flex items-center justify-center text-[#FFC107] shadow-lg shrink-0">
                <item.icon size={22} strokeWidth={2.2} />
              </div>
              <div className="pt-1 pb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FFC107] mb-1">
                  Step {item.step}
                </p>
                <h2 className="text-xl md:text-2xl font-black text-[#121212] tracking-tight mb-3">
                  {item.title}
                </h2>
                <p className="text-gray-500 font-medium text-sm md:text-base leading-relaxed">
                  {item.text}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-16 md:mt-20 p-8 md:p-10 rounded-3xl bg-gray-50 border border-gray-100 text-center"
        >
          <h3 className="text-lg md:text-xl font-black text-[#121212] tracking-tight mb-3">
            Ready to try it?
          </h3>
          <p className="text-gray-500 font-medium text-sm mb-6 max-w-md mx-auto">
            Open the dashboard, search your corridor, or start a pool—the app is built to be obvious once
            you are in.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn-primary inline-flex items-center justify-center gap-2">
              Back to dashboard
              <ChevronRight size={18} />
            </Link>
            <Link
              to="/security"
              className="btn-outline inline-flex items-center justify-center gap-2"
            >
              Safety &amp; trust
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HowItWorks;
