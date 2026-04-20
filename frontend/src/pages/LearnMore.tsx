import { motion } from 'framer-motion';
import { Shield, Leaf, Wallet, Users, ArrowRight, Car } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LearnMore() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      exit={{ opacity: 0 }}
      variants={containerVariants}
      className="min-h-screen bg-white pb-20 pt-10 md:pt-20"
    >
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-[#121212] tracking-tighter mb-4">
            Why ride with <span className="text-[#FFC107] italic">RouteMate?</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-2xl mx-auto md:text-lg">
            We're building a smarter, greener, and more connected way to commute. Say goodbye to solo driving and hello to the future of carpooling.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <motion.div variants={itemVariants} className="bg-gray-50 rounded-[2rem] p-8 md:p-10 border border-gray-100 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-[#FFC107]/20 rounded-2xl flex items-center justify-center mb-6">
              <Wallet className="text-[#FFC107]" size={28} />
            </div>
            <h3 className="text-2xl font-black text-[#121212] tracking-tight mb-3">Save on every commute</h3>
            <p className="text-gray-500 font-medium">Split the costs of fuel and tolls effortlessly. Whether you're driving or riding, everyone keeps more money in their pocket at the end of the month.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gray-50 rounded-[2rem] p-8 md:p-10 border border-gray-100 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Leaf className="text-green-600" size={28} />
            </div>
            <h3 className="text-2xl font-black text-[#121212] tracking-tight mb-3">Cut carbon emissions</h3>
            <p className="text-gray-500 font-medium">Every shared ride takes a car off the road. By filling empty seats, you're directly reducing traffic congestion and your city's carbon footprint.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gray-50 rounded-[2rem] p-8 md:p-10 border border-gray-100 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Users className="text-blue-600" size={28} />
            </div>
            <h3 className="text-2xl font-black text-[#121212] tracking-tight mb-3">Network on the go</h3>
            <p className="text-gray-500 font-medium">Turn boring commutes into valuable networking sessions. Meet colleagues, neighbors, and fellow professionals heading your exact way.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gray-50 rounded-[2rem] p-8 md:p-10 border border-gray-100 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="text-purple-600" size={28} />
            </div>
            <h3 className="text-2xl font-black text-[#121212] tracking-tight mb-3">Verified & secure</h3>
            <p className="text-gray-500 font-medium">All users are authenticated through email or phone. You can review profiles, mutual connections, and ratings before ever stepping into a car.</p>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="bg-[#121212] rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
            <Car size={300} className="absolute -bottom-20 -left-20 text-white rotate-12" />
            <Car size={200} className="absolute -top-10 -right-10 text-white -rotate-12" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-6 relative z-10">
            Ready to change how you travel?
          </h2>
          <p className="text-gray-400 font-medium max-w-xl mx-auto mb-10 relative z-10">
            Join thousands of smart commuters who are already saving money and making friends on their daily routes.
          </p>
          <Link 
            to="/auth" 
            className="inline-flex items-center gap-2 bg-[#FFC107] hover:bg-white text-[#121212] px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-colors relative z-10"
          >
            Get Started Now
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
