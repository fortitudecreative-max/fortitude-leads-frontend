import React, { useState, useEffect, useCallback } from 'react';
import { supabase, API } from '../App';
import Header from './Header';

const RED='#d60000',BG='#0a0a0a',CARD='#111',BORDER='#1e1e1e',MUTED='#666';
const SRC={rb2b:{bg:'#0d1a2e',border:'#1a3a6e',text:'#5b9bd5',label:'RB2B'},snitcher:{bg:'#0d2010',border:'#1a4020',text:'#4caf50',label:'SNITCHER'}};

function timeAgo(ts){const d=(Date.now()-new Date(ts))/1000;if(d<60)return Math.floor(d)+'s ago';if(d<3600)return Math.floor(d/60)+'m ago';if(d<86400)return Math.floor(d/3600)+'h ago';return Math.floor(d/86400)+'d ago';}

function Tag({label, value}){
  if(!value) return null;
  return <span style={{fontSize:12,color:'#888',background:'#181818',border:'1px solid #222',borderRadius:3,padding:'2px 8px',whiteSpace:'nowrap'}}><span style={{color:MUTED,marginRight:4}}>{label}</span>{value}</span>;
}

function LeadCard({lead}){
  const src=SRC[lead.source]||SRC.snitcher;
  const isRB2B=lead.source==='rb2b';
  const websiteUrl=lead.domain?'https://'+lead.domain:(lead.page_url||null);

  return(
    <div style={{background:CARD,border:'1px solid '+BORDER,borderRadius:6,padding:'20px 24px',marginBottom:12,display:'flex',gap:18,alignItems:'flex-start'}}>
      <div style={{background:src.bg,border:'1px solid '+src.border,borderRadius:4,padding:'4px 10px',fontSize:11,fontWeight:700,color:src.text,fontFamily:'Oswald,sans-serif',letterSpacing:'0.08em',whiteSpace:'nowrap',marginTop:3,flexShrink:0}}>{src.label}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'baseline',gap:10,flexWrap:'wrap',marginBottom:10}}>
          {isRB2B&&lead.name&&<span style={{fontFamily:'Oswald,sans-serif',fontSize:20,color:'#fff',fontWeight:500}}>{lead.name}</span>}
          {lead.company&&(
            websiteUrl
              ?<a href={websiteUrl} target="_blank" rel="noreferrer" style={{fontFamily:'Oswald,sans-serif',fontSize:isRB2B?16:20,color:isRB2B?'#aaa':'#fff',fontWeight:isRB2B?400:600,textDecoration:'none',borderBottom:'1px solid #333'}}>{isRB2B?'@ '+lead.company:lead.company}</a>
              :<span style={{fontFamily:'Oswald,sans-serif',fontSize:isRB2B?16:20,color:isRB2B?'#aaa':'#fff',fontWeight:isRB2B?400:600}}>{isRB2B?'@ '+lead.company:lead.company}</span>
          )}
          {lead.domain&&<span style={{fontSize:12,color:'#555'}}>({lead.domain})</span>}
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          <Tag label="Title" value={lead.title} />
          <Tag label="Industry" value={lead.industry} />
          <Tag label="Size" value={lead.employees} />
          <Tag label="Country" value={lead.country} />
          <Tag label="Pages" value={lead.pages_viewed} />
          <Tag label="Duration" value={lead.duration_seconds ? Math.round(lead.duration_seconds/60)+'m' : null} />
          <Tag label="Source" value={lead.traffic_source} />
          <Tag label="Landing" value={lead.landing_page||lead.page_url} />
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8,flexShrink:0}}>
        <span style={{fontSize:11,color:MUTED,whiteSpace:'nowrap'}}>{timeAgo(lead.created_at)}</span>
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
  const btn=(val,label,count)=><button onClick={()=>setFilter(val)} style={{background:filter===val?RED:'transparent',border:'1px solid '+(filter===val?RED:'#333'),borderRadius:4,padding:'7px 16px',color:filter===val?'#fff':'#999',fontSize:13,fontFamily:'Oswald,sans-serif',fontWeight:600,letterSpacing:'0.05em',cursor:'pointer'}}>{label}{count>0&&<span style={{opacity:0.7}}> ({count})</span>}</button>;

  return(
    <div style={{background:BG,minHeight:'100vh',fontFamily:'Barlow,sans-serif',margin:0,padding:0}}>
      <Header
        activeUnit="LEADS"
        rightSlot={
          <button onClick={()=>supabase.auth.signOut()} style={{background:'#171717',border:'1px solid #2A2A2A',borderRadius:4,padding:'7px 14px',color:'#8A8A8A',fontSize:12,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer',fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif'}}>Sign out</button>
        }
      />
      <div style={{maxWidth:920,margin:'0 auto',padding:'28px 24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24}}>
          {btn('all','ALL',counts.all)}
          <a href="https://app.rb2b.com/profiles" target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>{btn('rb2b','RB2B',counts.rb2b)}</a>
          <a href="https://app.snitcher.com/vAzzeXAN/dashboard/all-companies" target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>{btn('snitcher','SNITCHER',counts.snitcher)}</a>
          <div style={{flex:1}}/>
          <button onClick={fetchLeads} style={{background:'transparent',border:'1px solid #333',borderRadius:4,padding:'7px 14px',color:MUTED,fontSize:13,cursor:'pointer',fontFamily:'Barlow,sans-serif'}}>↻ Refresh</button>
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