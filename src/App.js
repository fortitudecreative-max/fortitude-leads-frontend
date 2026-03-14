import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Login from './components/Login';
import LeadsFeed from './components/LeadsFeed';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);
const API = process.env.REACT_APP_API_URL || 'https://fortitude-leads-backend-production.up.railway.app';
export { supabase, API };

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);
  if (loading) return <div style={{background:'#0a0a0a',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:'#555',fontFamily:'Barlow,sans-serif'}}>Loading...</div></div>;
  return session ? <LeadsFeed session={session} /> : <Login supabase={supabase} />;
}