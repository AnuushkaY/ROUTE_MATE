import { ShieldCheck, UserCheck, AlertTriangle, Lock } from 'lucide-react';

const Security = () => {
  return (
    <div className="container flex-col" style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', textAlign: 'center' }}>Trust & Security</h1>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '48px', fontSize: '1.1rem' }}>
        Your safety is our top priority. We use strict verification and monitoring tools.
      </p>

      <div className="flex-col gap-4">
        <div className="glass-card flex gap-4 items-center">
          <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '12px' }}>
             <UserCheck size={32} color="var(--accent)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Verified Identities</h3>
            <p style={{ color: 'var(--text-muted)' }}>Every user on ROUTEMATE goes through email and phone verification before they can post or join a pool. We strongly recommend completing your full profile to get a higher Trust Score.</p>
          </div>
        </div>

        <div className="glass-card flex gap-4 items-center">
          <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '12px' }}>
             <ShieldCheck size={32} color="var(--primary)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Heuristic Safe Matching</h3>
            <p style={{ color: 'var(--text-muted)' }}>Our matching algorithm doesn't just look at distance; it calculates safe routing boundaries. By utilizing Haversine radius limits, you only ever connect with locals traveling your exact route safely.</p>
          </div>
        </div>

        <div className="glass-card flex gap-4 items-center">
          <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '12px' }}>
             <Lock size={32} color="#f59e0b" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Encrypted Group Chats</h3>
            <p style={{ color: 'var(--text-muted)' }}>You don't need to share your personal number immediately. Coordinate the pickup securely through our end-to-end authenticated Supabase Real-time chat system.</p>
          </div>
        </div>

        <div className="glass-card flex gap-4 items-center border border-error">
          <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '12px' }}>
             <AlertTriangle size={32} color="var(--error)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--error)' }}>24/7 Report System</h3>
            <p style={{ color: 'var(--text-muted)' }}>If you ever feel unsafe or a user violates our terms, use the Report button in your active pool chat. The pool is permanently logged for moderation.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
