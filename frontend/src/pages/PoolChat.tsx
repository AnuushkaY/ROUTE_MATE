import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useParams } from 'react-router-dom';

const PoolChat = () => {
  const { poolId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Get the logged-in user's ID
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });

    // 2. Fetch existing messages with SENDER NAMES
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('pool_messages')
        .select(`
          *,
          user_profiles ( name )
        `) // This "Joins" the profile table to get the name
        .eq('pool_id', poolId)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };

    fetchMessages();

    // 3. Realtime Subscription (The Interactive Part)
    const channel = supabase.channel(`chat:${poolId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'pool_messages',
        filter: `pool_id=eq.${poolId}` 
      }, async (payload) => {
        // When a new message arrives, fetch the sender's name immediately
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('id', payload.new.sender_id)
          .single();
          
        const msgWithProfile = { ...payload.new, user_profiles: profile };
        setMessages((prev) => [...prev, msgWithProfile]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poolId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    const { error } = await supabase.from('pool_messages').insert({
      pool_id: poolId,
      sender_id: currentUserId,
      message: newMessage.trim()
    });

    if (!error) setNewMessage('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '90vh', padding: '20px' }}>
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
              {/* This shows the User Name if it's not you */}
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