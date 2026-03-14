import React, { useState } from 'react';
const s = {
  page:{background:'#0a0a0a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Barlow,sans-serif'},
  card:{background:'#111',border:'1px solid #222',borderRadius:8,padding:'48px 40px',width:360},
  logo:{fontFamily:'Oswald,sans-serif',fontSize:22,fontWeight:600,color:'#fff',letterSpacing:'0.05em',marginBottom:4},
  sub:{fontSize:13,color:'#555',marginBottom:36},
  label:{display:'block',fontSize:11,fontWeight:600,color:'#888',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:6},
  input:{width:'100%',background:'#0a0a0a',border:'1px solid #2a2a2a',borderRadius:4,padding:'10px 12px',color:'#fff',fontSize:14,fontFamily:'Barlow,sans-serif',outline:'none',boxSizing:'border-box',marginBottom:16},
  btn:{width:'100%',background:'#d60000',border:'none',borderRadius:4,padding:'12px',color:'#fff',fontSize:14,fontWeight:600,fontFamily:'Oswald,sans-serif',letterSpacing:'0.05em',cursor:'pointer',marginTop:8},
  err:{background:'#1a0000',border:'1px solid #3a0000',borderRadius:4,padding:'10px 12px',color:'#ff6b6b',fontSize:13,marginBottom:16},
};
export default function Login({ supabase }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };
  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>FORTITUDE</div>
        <div style={s.sub}>Leads Intelligence</div>
        {error && <div style={s.err}>{error}</div>}
        <form onSubmit={handleLogin}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button style={s.btn} type="submit" disabled={loading}>{loading ? 'SIGNING IN...' : 'SIGN IN'}</button>
        </form>
      </div>
    </div>
  );
}