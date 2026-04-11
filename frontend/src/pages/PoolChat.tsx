import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useParams } from 'react-router-dom';

const PoolChat = () => {
  const { poolId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pool, setPool] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [ratingModal, setRatingModal] = useState<{ open: boolean; target: any | null }>({ open: false, target: null });
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadPoolAndMembership = async () => {
    if (!poolId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUserId(user.id);
    const { data: poolData } = await supabase.from('pools').select('*').eq('id', poolId).single();
    if (!poolData) {
      setLoading(false);
      return;
    }

    setPool(poolData);
    await loadPoolParticipants(user.id, poolData.creator_id);
    const creator = poolData.creator_id === user.id;
    setIsCreator(creator);
    if (creator) {
      setIsMember(true);
      setRequestStatus(null);
    } else {
      const { data: acceptedRequests } = await supabase
        .from('pool_requests')
        .select('*')
        .eq('pool_id', poolId)
        .eq('requester_id', user.id)
        .eq('status', 'accepted');

      const { data: pendingRequests } = await supabase
        .from('pool_requests')
        .select('*')
        .eq('pool_id', poolId)
        .eq('requester_id', user.id)
        .eq('status', 'pending');

      const { data: rejectedRequests } = await supabase
        .from('pool_requests')
        .select('*')
        .eq('pool_id', poolId)
        .eq('requester_id', user.id)
        .eq('status', 'rejected');

      const acceptedCount = (acceptedRequests || []).length;
      const pendingCount = (pendingRequests || []).length;
      const rejectedCount = (rejectedRequests || []).length;

      setIsMember(acceptedCount > 0);
      if (acceptedCount > 0) {
        setRequestStatus('accepted');
      } else if (pendingCount > 0) {
        setRequestStatus('pending');
      } else if (rejectedCount > 0) {
        setRequestStatus('rejected');
      } else {
        setRequestStatus(null);
      }
    }
    setLoading(false);
  };

  const loadPoolParticipants = async (currentUserIdValue: string, creatorId: string) => {
    try {
      const { data: acceptedRequests } = await supabase
        .from('pool_requests')
        .select('requester_id, user_profiles(name)')
        .eq('pool_id', poolId)
        .eq('status', 'accepted');

      const creatorProfile = await supabase
        .from('user_profiles')
        .select('id, name')
        .eq('id', creatorId)
        .single();

      const people: any[] = [];
      if (creatorProfile.data && creatorProfile.data.id !== currentUserIdValue) {
        people.push({ id: creatorProfile.data.id, name: creatorProfile.data.name || 'Creator' });
      }

      (acceptedRequests || []).forEach((req: any) => {
        if (req.requester_id !== currentUserIdValue) {
          people.push({ id: req.requester_id, name: req.user_profiles?.name || 'Rider' });
        }
      });

      setParticipants(people);
    } catch (error) {
      console.error('Failed to load pool participants for rating', error);
      setParticipants([]);
    }
  };

  const openRatingModal = (participant: any) => {
    setRatingScore(0);
    setRatingComment('');
    setRatingModal({ open: true, target: participant });
  };

  const submitPersonRating = async () => {
    if (!ratingModal.target || !currentUserId) return;
    if (ratingScore <= 0 || ratingScore > 5) {
      alert('Please choose a rating between 1 and 5.');
      return;
    }

    setRatingSubmitting(true);
    try {
      const { error } = await supabase.from('ratings').insert([{ 
        rater_id: currentUserId,
        ratee_id: ratingModal.target.id,
        score: ratingScore,
        comments: ratingComment || null
      }]);

      if (error) {
        console.error('Rating save failed', error);
        alert('Unable to save rating. Please try again later.');
      } else {
        alert(`Rating saved for ${ratingModal.target.name || 'this rider'}.`);
        setRatingModal({ open: false, target: null });
      }
    } catch (err) {
      console.error('Could not submit rating:', err);
      alert('Failed to save rating. Please try again.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  useEffect(() => {
    loadPoolAndMembership();
  }, [poolId]);

  useEffect(() => {
    if (!poolId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('pool_messages')
        .select(`
          *,
          user_profiles ( name )
        `)
        .eq('pool_id', poolId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    const chatChannel = supabase.channel(`chat:${poolId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pool_messages',
        filter: `pool_id=eq.${poolId}`
      }, async (payload) => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('id', payload.new.sender_id)
          .single();
        const msgWithProfile = { ...payload.new, user_profiles: profile };
        setMessages((prev) => [...prev, msgWithProfile]);
      })
      .subscribe();

    const requestChannel = supabase.channel(`request-status:${poolId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pool_requests',
        filter: `pool_id=eq.${poolId},requester_id=eq.${currentUserId}`
      }, async () => {
        await loadPoolAndMembership();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(requestChannel);
    };
  }, [poolId, currentUserId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleRequestJoin = async () => {
    if (!pool || !currentUserId || !poolId) return;
    if (pool.status === 'full' || pool.available_seats === 0) {
      alert('This pool is full and cannot accept new members.');
      return;
    }
    if (requestStatus === 'pending') {
      alert('Your request is already pending.');
      return;
    }

    const { error } = await supabase.from('pool_requests').insert([{ 
      pool_id: poolId,
      requester_id: currentUserId,
      requester_source_lat: pool.source_lat,
      requester_source_lng: pool.source_lng,
      requester_dest_lat: pool.dest_lat,
      requester_dest_lng: pool.dest_lng,
      requester_time: pool.time_window_start,
      status: 'pending'
    }]);

    if (error) {
      alert('Unable to send join request.');
    } else {
      setRequestStatus('pending');
      alert('Join request submitted. The creator will review it soon.');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || (!isMember && !isCreator)) return;

    const { error } = await supabase.from('pool_messages').insert({
      pool_id: poolId,
      sender_id: currentUserId,
      message: newMessage.trim()
    });

    if (!error) setNewMessage('');
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading pool details...</div>;
  }

  if (!pool) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Pool not found.</div>;
  }

  if (!isMember && !isCreator) {
    return (
      <div style={{ padding: '24px', maxWidth: '720px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '12px' }}>{pool.source_text} → {pool.dest_text}</h2>
        <p style={{ marginBottom: '8px' }}>Status: <strong>{pool.status?.toUpperCase()}</strong></p>
        <p style={{ marginBottom: '18px', color: '#aaa' }}>
          You are not yet part of this pool. Request access and the pool creator can approve you based on score or personal review.
        </p>
        {requestStatus === 'accepted' ? (
          <button className="btn btn-primary" disabled>
            Request Accepted — access granted. Refresh if needed.
          </button>
        ) : requestStatus === 'pending' ? (
          <button className="btn btn-outline" disabled>
            Request Pending
          </button>
        ) : requestStatus === 'rejected' ? (
          <button className="btn btn-outline" disabled>
            Request Rejected
          </button>
        ) : pool.status === 'full' ? (
          <button className="btn btn-outline" disabled>
            Pool Full
          </button>
        ) : pool.status === 'completed' ? (
          <button className="btn btn-outline" disabled>
            Ride Completed
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleRequestJoin}>
            Request to Join
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '90vh', padding: '20px' }}>
      {ratingModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '28px', position: 'relative' }}>
            <button style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: 'transparent', color: '#fff', fontSize: '18px', cursor: 'pointer' }} onClick={() => setRatingModal({ open: false, target: null })}>
              ×
            </button>
            <h2 style={{ marginBottom: '12px' }}>Rate {ratingModal.target?.name || 'this rider'}</h2>
            <p className="text-muted" style={{ marginBottom: '16px' }}>Leave a score and optional comment for this person.</p>
            <div className="flex gap-2" style={{ marginBottom: '16px' }}>
              {[1,2,3,4,5].map((value) => (
                <button key={value} type="button" className={`btn ${ratingScore >= value ? 'btn-primary' : 'btn-outline'}`} onClick={() => setRatingScore(value)}>
                  {value}
                </button>
              ))}
            </div>
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Add a note (optional)"
              style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', marginBottom: '16px', background: 'rgba(255,255,255,0.03)', color: 'white' }}
            />
            <button className="btn btn-primary w-full" type="button" onClick={submitPersonRating} disabled={ratingSubmitting || ratingScore === 0}>
              {ratingSubmitting ? 'Saving...' : 'Save Rating'}
            </button>
          </div>
        </div>
      )}

      {participants.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '16px', padding: '18px' }}>
          <h3 style={{ marginBottom: '12px' }}>Rate riders or the creator</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {participants.map((person) => (
              <div key={person.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{person.name || 'Rider'}</p>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>{person.id}</p>
                </div>
                <button className="btn btn-outline" type="button" onClick={() => openRatingModal(person)}>
                  Rate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} style={{
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              backgroundColor: isMe ? '#007bff' : '#333',
              padding: '10px',
              borderRadius: '10px',
              color: 'white',
              maxWidth: '70%'
            }}>
              {!isMe && (
                <div style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: '4px' }}>
                  {msg.user_profiles?.name || 'User'}
                </div>
              )}
              <div>{msg.message}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', marginTop: '10px' }}>
        <input 
          style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" style={{ padding: '10px 20px', marginLeft: '5px' }}>Send</button>
      </form>
    </div>
  );
};

export default PoolChat;