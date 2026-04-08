import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // New state for Phone
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email'); // Toggle state
  
  const [otpToken, setOtpToken] = useState('');
  const [isTokenSent, setIsTokenSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [isNewUser, setIsNewUser] = useState(false);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      if (authMethod === 'email') {
        // --- EMAIL OTP FLOW ---
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            data: { name, gender, phone_number: phone }, // Attach metadata
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        setMessage('A 6-digit OTP has been sent to your email!');
      } else {
        // --- PHONE OTP FLOW ---
        const { error } = await supabase.auth.signInWithOtp({
          phone: phone, // Must be in E.164 format (e.g., +919876543210)
          options: {
            data: { name, gender, email: email }, // Attach metadata
          }
        });
        if (error) throw error;
        setMessage('An SMS OTP has been sent to your phone!');
      }

      setIsTokenSent(true);
    } catch (err: any) {
      setMessage(err.message);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let verifyResult;
      if (authMethod === 'email') {
        verifyResult = await supabase.auth.verifyOtp({
          email,
          token: otpToken.trim(),
          type: 'email'
        });
      } else {
        verifyResult = await supabase.auth.verifyOtp({
          phone,
          token: otpToken.trim(),
          type: 'sms'
        });
      }

      const { error, data } = verifyResult;
      if (error) throw error;

      // Upsert profile into public table
      if (data?.user) {
         await supabase.from('user_profiles').upsert({
             id: data.user.id,
             name: data.user.user_metadata?.name || name || 'User',
             gender: data.user.user_metadata?.gender || gender || 'Other',
             email: data.user.email || email,
             phone_number: data.user.phone || phone || '+910000000000'
         });
      }

      setMessage('Successfully authenticated!');
    } catch (err: any) {
      setMessage(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="container flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>ROUTEMATE</h2>
        
        {message && (
          <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '8px', marginBottom: '16px', color: 'white', fontSize: '0.9rem' }}>
            {message}
          </div>
        )}

        {/* --- TOGGLE BETWEEN EMAIL AND PHONE --- */}
        {!isTokenSent && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
            <button 
              type="button" 
              className={`btn ${authMethod === 'email' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setAuthMethod('email')}
              style={{ flex: 1, fontSize: '0.8rem' }}
            >
              Email OTP
            </button>
            <button 
              type="button" 
              className={`btn ${authMethod === 'phone' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setAuthMethod('phone')}
              style={{ flex: 1, fontSize: '0.8rem' }}
            >
              Phone OTP
            </button>
          </div>
        )}

        {!isTokenSent ? (
          <form onSubmit={handleAuth}>
            {authMethod === 'email' ? (
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            ) : (
              <div className="input-group">
                <label>Phone Number (with +country code)</label>
                <input type="tel" className="input-field" placeholder="+91..." value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            )}

            {/* Always show extra fields for New Users */}
            {!isNewUser ? (
               <div style={{ textAlign: 'right', marginBottom: '16px', fontSize: '0.85rem' }}>
                 <a href="#" onClick={(e) => { e.preventDefault(); setIsNewUser(true); }}>New here? Sign Up</a>
               </div>
            ) : (
              <>
                <div className="input-group">
                  <label>Full Name</label>
                  <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Gender</label>
                  <select className="input-field" value={gender} onChange={(e) => setGender(e.target.value)} required>
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {/* If using Email Auth, we need their phone for the profile */}
                {authMethod === 'email' && (
                   <div className="input-group">
                     <label>Phone Number</label>
                     <input type="tel" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                   </div>
                )}
                {/* If using Phone Auth, we need their email for the profile */}
                {authMethod === 'phone' && (
                   <div className="input-group">
                     <label>Email Address</label>
                     <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
                   </div>
                )}
                <div style={{ textAlign: 'right', marginBottom: '16px', fontSize: '0.85rem' }}>
                 <a href="#" onClick={(e) => { e.preventDefault(); setIsNewUser(false); }}>Already have an account? Log in</a>
               </div>
              </>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Sending Code...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="input-group">
              <label>Enter OTP Code</label>
              <input 
                type="text" className="input-field" value={otpToken} 
                onChange={(e) => setOtpToken(e.target.value)} 
                placeholder="123456" required 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '12px' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Log In'}
            </button>
            <button 
              type="button" className="btn btn-outline" style={{ width: '100%' }}
              onClick={() => setIsTokenSent(false)}
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;