import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Loader } from 'lucide-react';

const CreatePool = () => {
  const [formData, setFormData] = useState({
    sourceText: '',
    destText: '',
    capacity: 3,
    timeWindowStart: '',
    modeOfTransport: 'Car'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ── Helper: Geocoding ──────────────────────────────────────────────────────
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
    // Fallback coords (Delhi area)
    return { lat: 28.7041 + Math.random() * 0.05, lng: 77.1025 + Math.random() * 0.05 };
  };

  // ── Main Handler ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('You must be logged in to create a pool.');

      // 2. Ensure user profile exists (Required for Foreign Key)
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        const { error: profileError } = await supabase.from('user_profiles').insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          gender: user.user_metadata?.gender || 'Other',
          email: user.email,
          phone_number: user.user_metadata?.phone_number || '0000000000'
        });
        if (profileError) throw new Error('Could not create profile: ' + profileError.message);
      }

      // 3. Geocode addresses
      const sourceCoords = await handleGeocode(formData.sourceText);
      const destCoords = await handleGeocode(formData.destText);

      // 4. Insert the pool with status 'active'
      const { error: poolError } = await supabase.from('pools').insert({
        creator_id: user.id,
        source_lat: sourceCoords.lat,
        source_lng: sourceCoords.lng,
        source_geohash: `GH-${sourceCoords.lat.toFixed(2)}-${sourceCoords.lng.toFixed(2)}`,
        source_text: formData.sourceText,
        dest_lat: destCoords.lat,
        dest_lng: destCoords.lng,
        dest_text: formData.destText,
        time_window_start: new Date(formData.timeWindowStart).toISOString(),
        capacity: formData.capacity,
        available_seats: formData.capacity,
        mode_of_transport: formData.modeOfTransport,
        status: 'active' // <--- "Active" status used for visibility logic
      });

      if (poolError) throw new Error(poolError.message);

      setSuccess(true);
      setTimeout(() => navigate('/profile'), 2000);

    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render: Success State ──────────────────────────────────────────────────
  if (success) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="glass-card" style={{ maxWidth: '460px', width: '100%', textAlign: 'center', padding: '48px 32px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
          }}>
            <CheckCircle size={44} color="white" />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#10b981' }}>Pool Created!</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Your ride is now <strong>active</strong>. Redirecting to profile...
          </p>
        </div>
      </div>
    );
  }

  // ── Render: Form State ─────────────────────────────────────────────────────
  return (
    <div className="container flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="glass-card" style={{ maxWidth: '520px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Create a Ride Pool</h2>

        {error && (
          <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '20px', background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>📍 Source Address</label>
            <input
              type="text" className="input-field" required
              value={formData.sourceText}
              onChange={e => setFormData({ ...formData, sourceText: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>🏁 Destination Address</label>
            <input
              type="text" className="input-field" required
              value={formData.destText}
              onChange={e => setFormData({ ...formData, destText: e.target.value })}
            />
          </div>

          <div className="flex gap-4">
            <div className="input-group flex-col" style={{ flex: 1 }}>
              <label>👥 Capacity</label>
              <input
                type="number" className="input-field" min="1" max="10" required
                value={formData.capacity}
                onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              />
            </div>
            <div className="input-group flex-col" style={{ flex: 1 }}>
              <label>🚗 Transport</label>
              <select
                className="input-field" value={formData.modeOfTransport}
                onChange={e => setFormData({ ...formData, modeOfTransport: e.target.value })}
              >
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="Auto">Auto</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>🕐 Departure Time</label>
            <input
              type="datetime-local" className="input-field" required
              value={formData.timeWindowStart}
              onChange={e => setFormData({ ...formData, timeWindowStart: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} disabled={loading}>
            {loading ? <Loader size={18} className="animate-spin" /> : '🚀 Create Pool'}
          </button>
        </form>
      </div>
    </div>
  )
};

export default CreatePool;