import { useEffect, useState } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  User, Shield, Star, LogOut, CheckCircle, 
  Clock, History, MessageSquare, Phone, Mail, VenusAndMars, Calendar 
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api';

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [pools, setPools] = useState<any[]>([]);
  const [pendingRequestsByPool, setPendingRequestsByPool] = useState<Record<string, any[]>>({});
  const [reviewingPoolId, setReviewingPoolId] = useState<string | null>(null);
  const [requestPanel, setRequestPanel] = useState<any[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [ratingModal, setRatingModal] = useState<{ open: boolean; poolId: string | null }>({ open: false, poolId: null });
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [receivedRatings, setReceivedRatings] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRatingStats = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('ratings')
        .select('*')
        .eq('ratee_id', userId)
        .order('created_at', { ascending: false });

      if (!data || data.length === 0) {
        setReceivedRatings([]);
        setRatingCount(0);
        setAverageRating(0);
        return;
      }

      const raterIds = Array.from(new Set(data.map((ratingItem: any) => ratingItem.rater_id)));
      const { data: raterProfiles } = await supabase
        .from('user_profiles')
        .select('id, name')
        .in('id', raterIds);

      const raterMap = new Map<string, string>();
      (raterProfiles || []).forEach((profile: any) => {
        raterMap.set(profile.id, profile.name || 'Rider');
      });

      const enrichedRatings = data.map((ratingItem: any) => ({
        ...ratingItem,
        rater_name: raterMap.get(ratingItem.rater_id) || 'Rider'
      }));

      setReceivedRatings(enrichedRatings);
      setRatingCount(enrichedRatings.length);
      const avg = enrichedRatings.reduce((sum, item) => sum + Number(item.score || 0), 0) / enrichedRatings.length;
      setAverageRating(avg);
    } catch (err) {
      console.error('Failed to load user ratings:', err);
      setReceivedRatings([]);
      setRatingCount(0);
      setAverageRating(0);
    }
  };

  const fetchFullProfileData = async () => {
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Profile auth error', error);
        if (error.message?.includes('Invalid refresh token')) {
          await supabase.auth.signOut();
          navigate('/auth');
          return;
        }
      }

      if (user) {
        // 1. Fetch Detailed User Info
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileData) setProfile(profileData);

        // 2. Fetch user rating stats
        await fetchRatingStats(user.id);

        // 3. Fetch Pools
        const { data: myPools } = await supabase
          .from('pools')
          .select(`*`)
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });
          
        if (myPools) setPools(myPools);
      }
    } catch (err) {
      console.error('fetchFullProfileData failed', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async (poolIds: string[]) => {
    if (!poolIds.length) {
      setPendingRequestsByPool({});
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pool_requests')
        .select('*,user_profiles(*)')
        .in('pool_id', poolIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Pending requests load failed:', error);
        setPendingRequestsByPool({});
        return;
      }

      const grouped: Record<string, any[]> = {};
      (data || []).forEach((req: any) => {
        grouped[req.pool_id] = grouped[req.pool_id] || [];
        grouped[req.pool_id].push(req);
      });
      setPendingRequestsByPool(grouped);
    } catch (err) {
      console.error('Pending requests error:', err);
      setPendingRequestsByPool({});
    }
  };

  const loadRequestsForPool = async (poolId: string) => {
    setReviewingPoolId(poolId);
    setRequestPanel([]);
    try {
      const response = await axios.get(`${API_BASE_URL}/pools/${poolId}/requests`);
      const nextRequests = response.data.requests || [];
      if (nextRequests.length > 0) {
        setRequestPanel(nextRequests);
        return;
      }

      // Fallback to direct pending request data when backend returns an empty array
      const fallback = pendingRequestsByPool[poolId] || [];
      setRequestPanel(fallback);
    } catch (error) {
      console.error('Unable to load pool requests', error);
      try {
        const { data } = await supabase
          .from('pool_requests')
          .select('*,user_profiles(*)')
          .eq('pool_id', poolId)
          .eq('status', 'pending')
          .order('created_at', { ascending: true });
        setRequestPanel(data || pendingRequestsByPool[poolId] || []);
      } catch (fallbackError) {
        console.error('Fallback pending request load failed', fallbackError);
        setRequestPanel(pendingRequestsByPool[poolId] || []);
      }
    }
  };

  const respondToRequest = async (requestId: string, poolId: string, accept: boolean) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/pool_requests/${requestId}/respond`, {
        status: accept ? 'accepted' : 'rejected'
      });

      if (response.data?.status === 'ok') {
        const poolIds = pools.map((pool) => pool.id);
        if (poolIds.length) {
          await fetchPendingRequests(poolIds);
        }
        setRequestPanel((prev) => prev.filter((req: any) => req.id !== requestId));
        await fetchFullProfileData();
        setNotification(accept ? 'Request accepted and member granted pool chat access.' : 'Request rejected. The requester has been updated.');
        if (reviewingPoolId === poolId) {
          await loadRequestsForPool(poolId);
        }
      }
    } catch (error: any) {
      console.error('Unable to respond to request', error);
      if (error?.response?.data?.detail?.includes('Invalid refresh token') || error?.message?.includes('Invalid refresh token')) {
        await supabase.auth.signOut();
        navigate('/auth');
        return;
      }
      alert('Could not update request status.');
      console.error('Request response error:', error);
    }
  };

  useEffect(() => { fetchFullProfileData(); }, []);

  useEffect(() => {
    if (!pools.length) return;
    const poolIds = pools.map(pool => pool.id);
    fetchPendingRequests(poolIds);

    const channel = supabase.channel('pool_request_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pool_requests' }, (payload) => {
        if (payload.new && poolIds.includes(payload.new.pool_id)) {
          setNotification('New join request received for one of your pools.');
          fetchPendingRequests(poolIds);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pools]);

  const handleEndPool = (poolId: string) => {
    setRating(0);
    setRatingModal({ open: true, poolId });
  };

  const confirmDissolve = async () => {
    if (!ratingModal.poolId) return;
    const { error } = await supabase
      .from('pools')
      .update({ status: 'completed', rating: rating })
      .eq('id', ratingModal.poolId);

    if (!error) {
      setPools(prev => prev.map(p => p.id === ratingModal.poolId ? { ...p, status: 'completed', rating } : p));
      setRatingModal({ open: false, poolId: null });
    }
  };

  const activePools = pools.filter(p => p.status === 'open' || p.status === 'full' || p.status === 'active');
  const historyPools = pools.filter(p => p.status === 'completed');

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

            <div className="glass-card" style={{ marginTop: '20px', padding: '18px' }}>
              <h3 style={{ marginBottom: '10px' }}>Rider Reputation</h3>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 6px' }}>
                {ratingCount === 0 ? 'No ratings yet' : `${averageRating.toFixed(1)} / 5`}
              </p>
              <p className="text-sm text-muted" style={{ marginBottom: '12px' }}>
                {ratingCount} rating{ratingCount === 1 ? '' : 's'} received
              </p>
              {receivedRatings.length > 0 && (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {receivedRatings.slice(0, 3).map((ratingItem: any) => (
                    <div key={ratingItem.uuid || ratingItem.id || `${ratingItem.rater_id}-${ratingItem.created_at}`} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{ratingItem.rater_name || 'Rider'}</p>
                      <p className="text-muted" style={{ margin: '4px 0 6px' }}>Score: {ratingItem.score}/5</p>
                      {ratingItem.comments && <p style={{ margin: 0, fontSize: '0.9rem' }}>&quot;{ratingItem.comments}&quot;</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="btn btn-outline w-full" style={{ color: '#ff4d4d', borderColor: '#ff4d4d' }} onClick={() => supabase.auth.signOut().then(() => navigate('/auth'))}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </aside>

        {/* ── RIGHT: POOLS & HISTORY ── */}
        <main className="flex-col gap-10">
          {notification && (
            <div className="glass-card" style={{ borderLeft: '5px solid #f59e0b', padding: '16px' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>🔔 {notification}</p>
            </div>
          )}

          {/* ACTIVE POOLS */}
          <section>
            <h2 className="mb-6 flex items-center gap-3">🚀 Active Ride Pools</h2>
            {activePools.length === 0 ? <p className="text-muted glass-card text-center py-10">You have no active pools. Create one to start riding!</p> : 
              activePools.map(pool => {
                const pendingRequests = pendingRequestsByPool[pool.id] || [];
                return (
                  <div key={pool.id} className="glass-card mb-6" style={{ borderLeft: '5px solid var(--primary)' }}>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{pool.source_text} → {pool.dest_text}</h3>
                        <p className="text-sm text-primary flex items-center gap-2">
                          <Calendar size={14}/> Departure: {new Date(pool.time_window_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        <p className="text-sm text-muted" style={{ marginTop: '6px' }}>
                          {pool.available_seats} seats remaining · Status: {pool.status?.toUpperCase()}
                        </p>
                      </div>
                      <span className="badge badge-indigo">{pool.mode_of_transport}</span>
                    </div>

                    <div className="flex gap-3 flex-wrap" style={{ marginBottom: '16px' }}>
                      <button className="btn btn-primary flex-1 gap-2" style={{ padding: '14px', minWidth: '210px' }} onClick={() => navigate(`/chat/${pool.id}`)}>
                        <MessageSquare size={20} /> Open Chat
                      </button>
                      <button className="btn btn-outline flex-1" style={{ borderColor: '#ef4444', color: '#ef4444', minWidth: '210px' }} onClick={() => handleEndPool(pool.id)}>
                        End Pool
                      </button>
                      <button className="btn btn-outline flex-1" style={{ minWidth: '210px' }} onClick={() => loadRequestsForPool(pool.id)}>
                        View {pendingRequests.length} Pending Request{pendingRequests.length === 1 ? '' : 's'}
                      </button>
                    </div>
                    {pendingRequests.length > 0 && (
                      <p style={{ marginTop: '0', color: '#a3a3a3' }}>
                        {pendingRequests.length} pending join request{pendingRequests.length === 1 ? '' : 's'} waiting for review.
                      </p>
                    )}

                    {reviewingPoolId === pool.id && (
                      <div className="glass-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '16px' }}>
                        <h4 style={{ marginBottom: '12px' }}>Pending Requests</h4>
                        {requestPanel.length === 0 ? (
                          <p className="text-muted">No pending requests for this pool.</p>
                        ) : (
                          requestPanel.map((req: any) => (
                            <div key={req.id} className="glass-card mb-3" style={{ padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p style={{ margin: 0, fontWeight: 600 }}>{req.user_profiles?.name || 'Unknown Passenger'}</p>
                                  <p className="text-xs text-muted" style={{ margin: '4px 0' }}>Requested at {new Date(req.created_at).toLocaleString()}</p>
                                </div>
                                <span className="badge badge-blue">Score {Number(req.heuristic_score || 0).toFixed(1)}</span>
                              </div>
                              <p style={{ margin: '8px 0' }}>Route: {req.requester_source_lat}, {req.requester_source_lng} → {req.requester_dest_lat}, {req.requester_dest_lng}</p>
                              <div className="flex gap-2">
                                <button className="btn btn-primary flex-1" onClick={() => respondToRequest(req.id, pool.id, true)}>
                                  Accept
                                </button>
                                <button className="btn btn-outline flex-1" onClick={() => respondToRequest(req.id, pool.id, false)}>
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
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

          <section>
            <h2 className="mb-6 flex items-center gap-3 text-muted"><History size={24}/> Rider Reviews</h2>
            {receivedRatings.length === 0 ? (
              <p className="text-muted">No ratings received yet.</p>
            ) : (
              receivedRatings.map((ratingItem: any) => (
                <div key={ratingItem.uuid || ratingItem.id || `${ratingItem.rater_id}-${ratingItem.created_at}`} className="glass-card mb-4" style={{ opacity: 0.9, background: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <p style={{ margin: 0, fontWeight: 600 }}>{ratingItem.rater_name || 'Rider'}</p>
                    <span className="badge badge-gray">{ratingItem.score} / 5</span>
                  </div>
                  {ratingItem.comments && <p className="text-muted" style={{ margin: '0 0 8px' }}>{ratingItem.comments}</p>}
                  <p className="text-xs text-muted">{new Date(ratingItem.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default Profile;