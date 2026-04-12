import { motion } from 'framer-motion';
import { Car, ArrowRight } from 'lucide-react';

const HeroSection = ({ onExploreClick }: { onExploreClick: () => void }) => {
  return (
    <section className="relative w-full overflow-hidden bg-white pt-2 pb-0 md:pt-4 md:pb-1">
      {/* Background Taxi Animation */}
      <div className="absolute top-1/2 left-0 w-full h-32 -translate-y-1/2 pointer-events-none opacity-10 hidden md:block">
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-2 text-[#121212]"
        >
          <Car size={80} fill="currentColor" />
          <div className="h-1 w-64 bg-current rounded-full" />
        </motion.div>
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center flex flex-col items-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.05 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#121212] tracking-tighter leading-[0.95] mb-3"
        >
          Strangers today, <br />
          <span className="text-[#FFC107] italic">ride buddies</span> <br />
          tomorrow.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-gray-500 font-medium text-sm md:text-base max-w-2xl mb-3"
        >
          Join a smart, affordable, and social community of commuters.
          Find verified ride pools heading your way in seconds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto justify-center"
        >
          <button
            onClick={onExploreClick}
            className="btn-primary text-base px-8 py-3 group"
          >
            Find a Ride
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="btn-outline text-base px-8 py-3">
            Learn More
          </button>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#FFC107]/5 rounded-full blur-3xl" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#FFC107]/5 rounded-full blur-3xl" />
    </section>
  );
};

export default HeroSection;
