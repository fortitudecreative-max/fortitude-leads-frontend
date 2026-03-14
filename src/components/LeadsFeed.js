import React, { useState, useEffect, useCallback } from 'react';
import { supabase, API } from '../App';

const RED='#d60000',BG='#0a0a0a',CARD='#111',BORDER='#1e1e1e',MUTED='#666';
const SRC={rb2b:{bg:'#0d1a2e',border:'#1a3a6e',text:'#5b9bd5',label:'RB2B'},snitcher:{bg:'#0d2010',border:'#1a4020',text:'#4caf50',label:'SNITCHER'}};

function timeAgo(ts){const d=(Date.now()-new Date(ts))/1000;if(d<60)return Math.floor(d)+'s ago';if(d<3600)return Math.floor(d/60)+'m ago';if(d<86400)return Math.floor(d/3600)+'h ago';return Math.floor(d/86400)+'d ago';}

function LeadCard({lead}){
  const src=SRC[lead.source]||SRC.snitcher;
  const isRB2B=lead.source==='rb2b';
  const websiteUrl=lead.domain?'https://'+lead.domain:(lead.page_url||null);

  return(
    <div style={{background:CARD,border:'1px solid '+BORDER,borderRadius:6,padding:'22px 24px',marginBottom:12,display:'flex',gap:18,alignItems:'flex-start'}}>
      <div style={{background:src.bg,border:'1px solid '+src.border,borderRadius:4,padding:'4px 10px',fontSize:11,fontWeight:700,color:src.text,fontFamily:'Oswald,sans-serif',letterSpacing:'0.08em',whiteSpace:'nowrap',marginTop:3}}>{src.label}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'baseline',gap:12,flexWrap:'wrap',marginBottom:6}}>
          {isRB2B&&lead.name&&<span style={{fontFamily:'Oswald,sans-serif',fontSize:20,color:'#fff',fontWeight:500}}>{lead.name}</span>}
          {lead.company&&(
            websiteUrl
              ?<a href={websiteUrl} target="_blank" rel="noreferrer" style={{fontFamily:'Oswald,sans-serif',fontSize:isRB2B?16:20,color:isRB2B?'#999':'#fff',fontWeight:isRB2B?400:500,textDecoration:'none',borderBottom:'1px solid #333'}}>{isRB2B?'@ '+lead.company:lead.company}</a>
              :<span style={{fontFamily:'Oswald,sans-serif',fontSize:isRB2B?16:20,color:isRB2B?'#999':'#fff',fontWeight:isRB2B?400:500}}>{isRB2B?'@ '+lead.company:lead.company}</span>
          )}
          {lead.domain&&<span style={{fontSize:13,color:MUTED}}>({lead.domain})</span>}
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px 20px',fontSize:13,color:'#777'}}>
          {lead.title&&<span>💼 {lead.title}</span>}
          {lead.industry&&<span>🏭 {lead.industry}</span>}
          {lead.employees&&<span>👥 {lead.employees} employees</span>}
          {lead.country&&<span>🌎 {lead.country}</span>}
          {lead.pages_viewed&&<span>📄 {lead.pages_viewed} pages</span>}
          {lead.duration_seconds&&<span>⏱ {Math.round(lead.duration_seconds/60)} min</span>}
          {lead.traffic_source&&<span>🔍 via {lead.traffic_source}</span>}
          {(lead.landing_page||lead.page_url)&&<span style={{color:'#555'}}>🛬 {lead.landing_page||lead.page_url}</span>}
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8,flexShrink:0}}>
        <span style={{fontSize:12,color:MUTED}}>{timeAgo(lead.created_at)}</span>
        {websiteUrl&&<a href={websiteUrl} target="_blank" rel="noreferrer" style={{background:'#1a1a1a',border:'1px solid #2a2a2a',color:'#aaa',fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:3,textDecoration:'none',fontFamily:'Oswald,sans-serif',letterSpacing:'0.05em'}}>WEBSITE ↗</a>}
        {lead.linkedin_url&&<a href={lead.linkedin_url} target="_blank" rel="noreferrer" style={{background:'#0077b5',color:'#fff',fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:3,textDecoration:'none',fontFamily:'Oswald,sans-serif',letterSpacing:'0.05em'}}>LINKEDIN</a>}
      </div>
    </div>
  );
}

export default function LeadsFeed({session}){
  const [leads,setLeads]=useState([]);
  const [filter,setFilter]=useState('all');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  const fetchLeads=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const params=new URLSearchParams({limit:200,offset:0});
      if(filter!=='all')params.set('source',filter);
      const res=await fetch(API+'/api/leads?'+params,{headers:{Authorization:'Bearer '+session.access_token}});
      const data=await res.json();
      if(data.error)throw new Error(data.error);
      setLeads(data.leads||[]);
    }catch(e){setError(e.message);}
    setLoading(false);
  },[filter,session]);

  useEffect(()=>{fetchLeads();},[fetchLeads]);

  useEffect(()=>{
    const ch=supabase.channel('leads').on('postgres_changes',{event:'INSERT',schema:'public',table:'leads'},p=>{
      if(filter==='all'||p.new.source===filter)setLeads(prev=>[p.new,...prev]);
    }).subscribe();
    return()=>supabase.removeChannel(ch);
  },[filter]);

  const counts={all:leads.length,rb2b:leads.filter(l=>l.source==='rb2b').length,snitcher:leads.filter(l=>l.source==='snitcher').length};
  const btn=(val,label,count)=><button onClick={()=>setFilter(val)} style={{background:filter===val?RED:'transparent',border:'1px solid '+(filter===val?RED:'#333'),borderRadius:4,padding:'8px 18px',color:filter===val?'#fff':'#999',fontSize:13,fontFamily:'Oswald,sans-serif',fontWeight:600,letterSpacing:'0.05em',cursor:'pointer'}}>{label}{count>0&&<span style={{opacity:0.7}}> ({count})</span>}</button>;

  return(
    <div style={{background:BG,minHeight:'100vh',fontFamily:'Barlow,sans-serif'}}>
      {/* Header — matches fortitudecreative.com */}
      <div style={{background:RED,borderBottom:'3px solid #000',padding:'0 28px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <a href="https://fortitudecreative.com" target="_blank" rel="noreferrer">
          <img src="https://fortitudecreative.com/wp-content/uploads/2025/04/Fortitude-Logo32.svg" alt="Fortitude Creative" style={{height:44,display:'block'}} />
        </a>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{fontSize:13,color:'rgba(255,255,255,0.7)',fontFamily:'Barlow,sans-serif',letterSpacing:'0.05em',textTransform:'uppercase'}}>Leads Intelligence</span>
          <button onClick={()=>supabase.auth.signOut()} style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:4,padding:'6px 14px',color:'rgba(255,255,255,0.8)',fontSize:12,cursor:'pointer',fontFamily:'Barlow,sans-serif'}}>Sign out</button>
        </div>
      </div>

      <div style={{maxWidth:900,margin:'0 auto',padding:'32px 24px'}}>
        {/* Filter bar */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24}}>
          {btn('all','ALL',counts.all)}{btn('rb2b','RB2B',counts.rb2b)}{btn('snitcher','SNITCHER',counts.snitcher)}
          <div style={{flex:1}}/>
          <button onClick={fetchLeads} style={{background:'transparent',border:'1px solid #333',borderRadius:4,padding:'8px 14px',color:MUTED,fontSize:13,cursor:'pointer',fontFamily:'Barlow,sans-serif'}}>↻ Refresh</button>
        </div>

        {error&&<div style={{background:'#1a0000',border:'1px solid #3a0000',borderRadius:4,padding:'14px 18px',color:'#ff6b6b',fontSize:14,marginBottom:16}}>{error}</div>}
        {loading
          ?<div style={{textAlign:'center',color:MUTED,padding:80,fontSize:14}}>Loading leads...</div>
          :leads.length===0
            ?<div style={{textAlign:'center',color:MUTED,padding:80,fontSize:14}}>No leads yet. They will appear here as visitors are identified.</div>
            :leads.map(lead=><LeadCard key={lead.id} lead={lead}/>)
        }
      </div>
    </div>
  );
}