import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Loader, Navigation, MapPin, Users, Car, Clock, ChevronRight, ArrowLeft } from 'lucide-react';

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

const encodeGeohash = (lat: number, lng: number, precision: number = 6): string => {
  let isEven = true;
  let bit = 0;
  let ch = 0;
  let geohash = '';
  let latInterval: [number, number] = [-90, 90];
  let lngInterval: [number, number] = [-180, 180];

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lngInterval[0] + lngInterval[1]) / 2;
      if (lng >= mid) {
        ch = (ch << 1) + 1;
        lngInterval[0] = mid;
      } else {
        ch = ch << 1;
        lngInterval[1] = mid;
      }
    } else {
      const mid = (latInterval[0] + latInterval[1]) / 2;
      if (lat >= mid) {
        ch = (ch << 1) + 1;
        latInterval[0] = mid;
      } else {
        ch = ch << 1;
        latInterval[1] = mid;
      }
    }

    isEven = !isEven;
    bit += 1;

    if (bit === 5) {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
};

const CreatePool = () => {
  const [formData, setFormData] = useState({
    sourceText: '',
    destText: '',
    capacity: 3,
    timeWindowStart: '',
    modeOfTransport: 'Car',
    price: 50
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGeocode = async (address: string) => {
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
        { headers: { 'User-Agent': 'RouteMateApp/1.0' } }
      );
      if (res.data && res.data.length > 0) {
        return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
      }
    } catch (e) {
      console.warn('Geocoding failed, using fallback.', e);
    }
    return { lat: 19.0760 + Math.random() * 0.05, lng: 72.8777 + Math.random() * 0.05 };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('You must be logged in to create a pool.');

      const sourceCoords = await handleGeocode(formData.sourceText);
      const destCoords = await handleGeocode(formData.destText);

      const { error: poolError } = await supabase.from('pools').insert({
        creator_id: user.id,
        source_lat: sourceCoords.lat,
        source_lng: sourceCoords.lng,
        source_geohash: encodeGeohash(sourceCoords.lat, sourceCoords.lng, 6),
        source_text: formData.sourceText,
        dest_lat: destCoords.lat,
        dest_lng: destCoords.lng,
        dest_text: formData.destText,
        time_window_start: new Date(formData.timeWindowStart).toISOString(),
        capacity: formData.capacity,
        available_seats: formData.capacity,
        mode_of_transport: formData.modeOfTransport,
        price_per_seat: formData.price,
        status: 'open'
      });

      if (poolError) throw new Error(poolError.message);

      setSuccess(true);
      setTimeout(() => navigate('/profile'), 2500);

    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-6 py-12 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center"
    >
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="form"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="w-full max-w-2xl bg-white rounded-[2.5rem] border border-gray-100 p-10 md:p-16 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-black text-[#121212] tracking-tighter mb-2">Host a <span className="text-[#FFC107] italic">Ride</span></h2>
                <p className="text-gray-400 font-bold text-sm">Fill in the details to find your ride buddies.</p>
              </div>
              <div className="w-16 h-16 bg-[#FFC107]/10 rounded-2xl flex items-center justify-center text-[#FFC107]">
                <Car size={32} />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-100 text-red-500 p-4 rounded-2xl mb-8 text-sm font-bold flex gap-3"
              >
                <span>⚠️</span> {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Starting Point</label>
                  <div className="relative">
                    <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFC107]" size={18} />
                    <input
                      type="text"
                      className="input-premium pl-12"
                      placeholder="e.g. Bandra Station"
                      value={formData.sourceText}
                      onChange={e => setFormData({ ...formData, sourceText: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Destination</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFC107]" size={18} />
                    <input
                      type="text"
                      className="input-premium pl-12"
                      placeholder="e.g. Nariman Point"
                      value={formData.destText}
                      onChange={e => setFormData({ ...formData, destText: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Seats</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFC107]" size={18} />
                    <input
                      type="number"
                      min="1" max="10"
                      className="input-premium pl-12"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Vehicle</label>
                  <select
                    className="input-premium"
                    value={formData.modeOfTransport}
                    onChange={e => setFormData({ ...formData, modeOfTransport: e.target.value })}
                  >
                    <option value="Car">Car</option>
                    <option value="Bike">Bike</option>
                    <option value="Auto">Auto</option>
                  </select>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Price (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFC107] font-black">₹</span>
                    <input
                      type="number"
                      className="input-premium pl-10"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Departure Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFC107]" size={18} />
                  <input
                    type="datetime-local"
                    className="input-premium pl-12"
                    value={formData.timeWindowStart}
                    onChange={e => setFormData({ ...formData, timeWindowStart: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 h-[64px] bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] btn-primary h-[64px] text-lg group"
                >
                  {loading ? <Loader className="animate-spin mr-2" /> : 'Host Ride'}
                  <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="w-32 h-32 bg-[#FFC107] rounded-full flex items-center justify-center mx-auto mb-10 shadow-lg animate-pin-bounce">
              <CheckCircle size={64} className="text-[#121212]" strokeWidth={3} />
            </div>
            <h2 className="text-6xl font-black text-[#121212] tracking-tighter mb-4 italic">Ride Live!</h2>
            <p className="text-gray-400 font-bold text-xl">Your pool is active. Redirecting you to your dashboard...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CreatePool;