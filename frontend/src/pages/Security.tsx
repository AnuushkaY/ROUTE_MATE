import { motion } from 'framer-motion';
import { ShieldCheck, UserCheck, AlertTriangle, Lock, Shield, ChevronRight } from 'lucide-react';

const Security = () => {
  const protocols = [
    {
      icon: UserCheck,
      title: "Verified Identities",
      text: "Every user goes through mandatory email and phone verification. We prioritize verified profiles to ensure a high-trust environment.",
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      icon: ShieldCheck,
      title: "Safe Path Matching",
      text: "Our algorithm calculates precise routing boundaries, ensuring you only connect with buddies traveling your exact, safe route.",
      color: "text-green-500",
      bg: "bg-green-50"
    },
    {
      icon: Lock,
      title: "Protected Messaging",
      text: "Coordinate pickups through our secure, real-time chat system without sharing your personal number until you feel ready.",
      color: "text-[#FFC107]",
      bg: "bg-[#FFC107]/10"
    },
    {
      icon: AlertTriangle,
      title: "24/7 Monitoring",
      text: "Our team stands by to moderate reports. Every pool interaction is logged and reviewed to keep our streets safe for everyone.",
      color: "text-red-500",
      bg: "bg-red-50"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-6 py-20 max-w-4xl"
    >
      <div className="text-center mb-20">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#121212] text-white rounded-2xl mb-6 shadow-xl"
        >
          <Shield size={16} className="text-[#FFC107]" />
          <span className="text-[10px] font-black uppercase tracking-widest">Protocol V2.0</span>
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black text-[#121212] tracking-tighter mb-6 italic">Trust is <span className="text-[#FFC107]">Everything.</span></h1>
        <p className="text-gray-500 font-bold text-lg md:text-xl max-w-2xl mx-auto">
          We've built RouteMate on a foundation of safety, anonymity, and community trust.
          Here's how we protect our buddies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {protocols.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-lg hover:shadow-lg transition-all group"
          >
            <div className={`w-16 h-16 ${item.bg} rounded-2xl flex items-center justify-center mb-8 transform group-hover:rotate-12 transition-transform`}>
              <item.icon size={32} className={item.color} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-[#121212] tracking-tighter mb-4">{item.title}</h3>
            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8">
              {item.text}
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-300 group-hover:text-[#121212] transition-colors">
              Learn more <ChevronRight size={14} />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        className="mt-20 bg-[#121212] rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFC107]/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFC107]/5 blur-[100px] rounded-full" />

        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-8 italic">Your safety isn't an <br /> <span className="text-[#FFC107] italic">afterthought.</span></h2>
        <p className="text-gray-400 font-bold mb-12 max-w-xl mx-auto">
          If you ever feel unsafe or notice suspicious behavior, our live reporting system is always one tap away.
        </p>
        <button className="btn-primary px-12 h-16 text-lg">
          View Full Safety Guide
        </button>
      </motion.div>

    </motion.div>
  );
};

export default Security;
