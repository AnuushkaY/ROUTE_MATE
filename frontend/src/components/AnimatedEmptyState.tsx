import { motion } from 'framer-motion';
import { Car } from 'lucide-react';

const AnimatedEmptyState = ({ message = "No rides found right now." }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <motion.div
        animate={{
          x: [-10, 10, -10],
          y: [0, -5, 0],
          rotate: [-1, 1, -1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative mb-8"
      >
        <div className="w-32 h-32 bg-[#FFC107]/10 rounded-full flex items-center justify-center">
          <Car size={64} className="text-[#FFC107]" />
        </div>

        {/* Animated Zzz or particles */}
        <motion.div
          animate={{ opacity: [0, 1, 0], y: [-20, -40] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-2 -right-2 text-[#FFC107] font-black text-xl"
        >
          ?
        </motion.div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-2xl font-black text-[#121212] mb-2"
      >
        Quiet Streets...
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-500 font-medium max-w-xs"
      >
        {message} Try adjusting your search or host the first ride of the day!
      </motion.p>
    </div>
  );
};

export default AnimatedEmptyState;
