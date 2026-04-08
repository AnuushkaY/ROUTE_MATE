import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  User, Shield, Star, LogOut, CheckCircle, 
  Clock, History, MessageSquare, Phone, Mail, VenusAndMars, Calendar 
} from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [pools, setPools] = useState<any[]>([]);
  const [ratingModal, setRatingModal] = useState<{ open: boolean; poolId: string | null }>({ open: false, poolId: null });
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFullProfileData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // 1. Fetch Detailed User Info
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileData) setProfile(profileData);

      // 2. Fetch Pools
      const { data: myPools } = await supabase
        .from('pools')
        .select(`*`)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
        
      if (myPools) setPools(myPools);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFullProfileData(); }, []);

  const handleEndPool = (poolId: string) => {
    setRating(0);
    setRatingModal({ open: true, poolId });
  };

  const confirmDissolve = async () => {
    if (!ratingModal.poolId) return;
    const { error } = await supabase
      .from('pools')
      .update({ status: 'dissolved', rating: rating })
      .eq('id', ratingModal.poolId);

    if (!error) {
      setPools(prev => prev.map(p => p.id === ratingModal.poolId ? { ...p, status: 'dissolved', rating } : p));
      setRatingModal({ open: false, poolId: null });
    }
  };

  const activePools = pools.filter(p => p.status === 'active' || p.status === 'open');
  const historyPools = pools.filter(p => p.status === 'dissolved');

  if (loading) return <div className="container p-10 text-center">Loading Profile Details...</div>;

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      
      {/* ── RATING MODAL ── */}
      {ratingModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div className="glass-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
            <h2 style={{ marginBottom: '12px' }}>Ride Completed!</h2>
            <p className="text-muted" style={{ marginBottom: '24px' }}>How would you rate the experience with your co-riders?</p>
            <div className="flex justify-center gap-2 mb-8">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={36} onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                  fill={(hoverRating || rating) >= s ? '#fbbf24' : 'none'} color={(hoverRating || rating) >= s ? '#fbbf24' : '#555'} style={{ cursor: 'pointer', transition: 'transform 0.1s' }} />
              ))}
            </div>
            <button className="btn btn-primary w-full" onClick={confirmDissolve} disabled={rating === 0}>Save to History</button>
          </div>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '320px 1fr', gap: '40px' }}>
        
        {/* ── LEFT: USER INFO ── */}
        <aside>
          <div className="glass-card flex-col gap-6" style={{ position: 'sticky', top: '24px' }}>
            <div className="text-center">
              <div style={{ width: '90px', height: '90px', background: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(255,255,255,0.1)' }}>
                <User size={44} color="white" />
              </div>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>{profile?.name}</h2>
              <span className="badge badge-green"><Shield size={12} /> Identity Verified</span>
            </div>

            <div className="flex-col gap-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <div className="flex items-center gap-3 text-sm"><Mail size={16} className="text-primary"/> {profile?.email}</div>
              <div className="flex items-center gap-3 text-sm"><Phone size={16} className="text-primary"/> {profile?.phone_number}</div>
              <div className="flex items-center gap-3 text-sm"><VenusAndMars size={16} className="text-primary"/> {profile?.gender}</div>
            </div>

            <button className="btn btn-outline w-full" style={{ color: '#ff4d4d', borderColor: '#ff4d4d' }} onClick={() => supabase.auth.signOut().then(() => navigate('/auth'))}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </aside>

        {/* ── RIGHT: POOLS & HISTORY ── */}
        <main className="flex-col gap-10">
          
          {/* ACTIVE POOLS */}
          <section>
            <h2 className="mb-6 flex items-center gap-3">🚀 Active Ride Pools</h2>
            {activePools.length === 0 ? <p className="text-muted glass-card text-center py-10">You have no active pools. Create one to start riding!</p> : 
              activePools.map(pool => (
                <div key={pool.id} className="glass-card mb-6" style={{ borderLeft: '5px solid var(--primary)' }}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{pool.source_text} → {pool.dest_text}</h3>
                      <p className="text-sm text-primary flex items-center gap-2">
                        <Calendar size={14}/> Departure: {new Date(pool.time_window_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <span className="badge badge-indigo">{pool.mode_of_transport}</span>
                  </div>
                  
                  <div className="flex gap-4">
                    <button className="btn btn-primary flex-1 gap-2" style={{ padding: '14px' }} onClick={() => navigate(`/chat/${pool.id}`)}>
                      <MessageSquare size={20} /> Open Chat
                    </button>
                    <button className="btn btn-outline flex-1" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleEndPool(pool.id)}>
                      End Pool
                    </button>
                  </div>
                </div>
              ))
            }
          </section>

          {/* DISSOLVED HISTORY WITH FULL TIME DATA */}
          <section>
            <h2 className="mb-6 flex items-center gap-3 text-muted"><History size={24}/> Ride History</h2>
            {historyPools.length === 0 ? <p className="text-muted">No ride history available.</p> : 
              historyPools.map(pool => (
                <div key={pool.id} className="glass-card mb-4" style={{ opacity: 0.8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-col gap-2">
                      <p className="font-bold text-lg">{pool.source_text} to {pool.dest_text}</p>
                      
                      {/* Detailed Timestamps */}
                      <div className="flex-col gap-1 mt-2">
                        <p className="text-xs text-muted flex items-center gap-2">
                          <Clock size={12}/> **Created:** {new Date(pool.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        <p className="text-xs text-muted flex items-center gap-2">
                          <CheckCircle size={12}/> **Departed:** {new Date(pool.time_window_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>

                      <div className="flex text-yellow-500 mt-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < (pool.rating || 0) ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="badge" style={{ background: '#222', color: '#888' }}>COMPLETED</span>
                      <p className="text-xs text-muted mt-2">{pool.mode_of_transport}</p>
                    </div>
                  </div>
                </div>
              ))
            }
          </section>
        </main>
      </div>
    </div>
  );
};

export default Profile;