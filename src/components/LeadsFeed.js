import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, API } from '../App';
import Header from './Header';

// Brand tokens — kept identical to the admin-shell (Branding) and
// fortitude-admin (Marketing) dashboards so switching apps doesn't change
// colours, fonts, or spacing.
const BRAND_FONT = "'Oswald', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const BG = '#0A0A0A';
const CARD_GRADIENT = 'linear-gradient(180deg, #141414 0%, #0E0E0E 100%)';
const KPI_GRADIENT = 'linear-gradient(180deg, #171717 0%, #0E0E0E 100%)';
const LINE = '#2A2A2A';
const PANEL = '#171717';
const MUTED = '#8A8A8A';
const DIM = '#4A4A4A';
const RED = '#D60000';

const SRC = {
  rb2b: { bg: 'rgba(46,139,234,0.15)', color: '#5B9BD5', label: 'RB2B' },
  snitcher: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E', label: 'SNITCHER' },
};

function timeAgo(ts) {
  const d = (Date.now() - new Date(ts)) / 1000;
  if (d < 60) return Math.floor(d) + 's ago';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
}

function Tag({ label, value }) {
  if (!value) return null;
  return (
    <span style={{
      fontFamily: BRAND_FONT, fontSize: 11, color: '#aaa',
      background: '#171717', border: '1px solid #222', borderRadius: 4,
      padding: '3px 8px', whiteSpace: 'nowrap', letterSpacing: '0.02em',
    }}>
      <span style={{ color: MUTED, marginRight: 4, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      {value}
    </span>
  );
}

function LeadRow({ lead, index }) {
  const src = SRC[lead.source] || SRC.snitcher;
  const isRB2B = lead.source === 'rb2b';
  const websiteUrl = lead.domain ? 'https://' + lead.domain : (lead.page_url || null);
  const primaryName = isRB2B && lead.name
    ? lead.name
    : (lead.company || lead.domain || '—');
  const subCompany = isRB2B ? (lead.company ? '@ ' + lead.company : null) : null;

  return (
    <div style={s.leadRow}>
      <div style={s.numCell}>{index + 1}</div>
      <div>
        <span style={{ ...s.sourcePill, background: src.bg, color: src.color }}>{src.label}</span>
      </div>
      <div>
        <div style={s.leadName}>{primaryName}</div>
        <div style={s.leadSub}>
          {subCompany && <span style={{ marginRight: 8 }}>{subCompany}</span>}
          {lead.domain && <span style={{ color: DIM }}>{lead.domain}</span>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          <Tag label="Title" value={lead.title} />
          <Tag label="Industry" value={lead.industry} />
          <Tag label="Size" value={lead.employees} />
          <Tag label="Country" value={lead.country} />
          <Tag label="Pages" value={lead.pages_viewed} />
          <Tag label="Duration" value={lead.duration_seconds ? Math.round(lead.duration_seconds / 60) + 'm' : null} />
          <Tag label="Source" value={lead.traffic_source} />
        </div>
      </div>
      <div style={s.leadTimeCol}>
        <span style={s.timeAgo}>{timeAgo(lead.created_at)}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
          {websiteUrl && (
            <a href={websiteUrl} target="_blank" rel="noreferrer" style={s.btnSecondary}>Website ↗</a>
          )}
          {lead.linkedin_url && (
            <a href={lead.linkedin_url} target="_blank" rel="noreferrer" style={s.btnLinkedin}>LinkedIn</a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LeadsFeed({ session }) {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ limit: 200, offset: 0 });
      if (filter !== 'all') params.set('source', filter);
      const res = await fetch(API + '/api/leads?' + params, { headers: { Authorization: 'Bearer ' + session.access_token } });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLeads(data.leads || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [filter, session]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    const ch = supabase.channel('leads').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, p => {
      if (filter === 'all' || p.new.source === filter) setLeads(prev => [p.new, ...prev]);
    }).subscribe();
    return () => supabase.removeChannel(ch);
  }, [filter]);

  // KPI numbers. Use the currently loaded page of leads for counts by source;
  // "Last 24h" counts leads with a created_at newer than 24 hours ago.
  const stats = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let rb2b = 0, snitcher = 0, last24 = 0;
    leads.forEach(l => {
      if (l.source === 'rb2b') rb2b++;
      if (l.source === 'snitcher') snitcher++;
      if (l.created_at && (now - new Date(l.created_at).getTime()) < dayMs) last24++;
    });
    return { total: leads.length, rb2b, snitcher, last24 };
  }, [leads]);

  const kpis = [
    { label: 'Total Leads', value: String(stats.total), sub: filter === 'all' ? 'across all sources' : 'filtered',
      iconBg: 'rgba(214,0,0,0.15)', iconColor: RED, icon: '#', valueColor: '#fff' },
    { label: 'RB2B', value: String(stats.rb2b), sub: 'identified visitors',
      iconBg: 'rgba(91,155,213,0.15)', iconColor: '#5B9BD5', icon: '\u25A0', valueColor: '#5B9BD5' },
    { label: 'Snitcher', value: String(stats.snitcher), sub: 'company matches',
      iconBg: 'rgba(34,197,94,0.15)', iconColor: '#22C55E', icon: '\u2192', valueColor: '#22C55E' },
    { label: 'Last 24h', value: String(stats.last24), sub: 'new in window',
      iconBg: 'rgba(245,158,11,0.15)', iconColor: '#F59E0B', icon: '\u25CF', valueColor: '#F59E0B' },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ background: BG, minHeight: '100vh', margin: 0, padding: 0 }}>
      {/* KPI grid responsive override — matches Branding / Marketing: 2 cols
          on narrower screens, 4 cols at 1024px+. Can't inline media queries in
          React styles so a tiny <style> tag keeps this self-contained. */}
      <style>{`
        .kpi-grid { grid-template-columns: repeat(2, 1fr); }
        @media (min-width: 1024px) { .kpi-grid { grid-template-columns: repeat(4, 1fr); } }
      `}</style>
      <Header
        activeUnit="LEADS"
        rightSlot={
          <button onClick={() => supabase.auth.signOut()} style={s.signOut}>Sign out</button>
        }
      />
      <main style={s.main}>
        {/* Page header — matches Branding / Marketing */}
        <div style={s.pageHeader}>
          <div>
            <div style={s.eyebrow}>Fortitude</div>
            <h1 style={s.pageTitle}>Lead Dashboard</h1>
            <div style={s.dateLine}>{today}</div>
          </div>
          <div style={s.actions}>
            <button onClick={fetchLeads} style={s.actionBtn} title="Refresh leads">↻ Refresh</button>
          </div>
        </div>

        {/* KPI row — 4 cards, same style as Branding / Marketing */}
        <div className="kpi-grid" style={s.statGrid}>
          {kpis.map(k => (
            <div key={k.label} style={s.statCard}>
              <div style={{ ...s.statIcon, background: k.iconBg, color: k.iconColor }}>{k.icon}</div>
              <div style={s.statLabel}>{k.label}</div>
              <div style={{ ...s.statValue, color: k.valueColor }}>{k.value}</div>
              {k.sub && <div style={s.statSub}>{k.sub}</div>}
            </div>
          ))}
        </div>

        {/* Leads section card — 'LEADS' title left, Source filter right */}
        <div style={s.leadsCard}>
          <div style={s.leadsHeader}>
            <h3 style={s.sectionTitle}>Leads</h3>
            <div style={s.filterWrap}>
              <label style={s.filterLabel}>Source</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} style={s.sortSelect}>
                <option value="all">All sources</option>
                <option value="rb2b">RB2B · identified visitors</option>
                <option value="snitcher">Snitcher · company matches</option>
              </select>
            </div>
          </div>
          {/* Column headers */}
          <div style={{ ...s.colHeaderRow }}>
            <div style={s.colHeadCenter}>#</div>
            <div style={s.colHead}>Source</div>
            <div style={s.colHead}>Company / Contact</div>
            <div style={s.colHeadR}>Activity</div>
          </div>
          <div style={{ height: 2, background: RED }} />

          {/* Body */}
          {error && (
            <div style={s.errorBox}>{error}</div>
          )}
          {loading ? (
            <div style={s.empty}>Loading leads…</div>
          ) : leads.length === 0 ? (
            <div style={s.empty}>No leads yet. They'll appear here as visitors are identified.</div>
          ) : (
            leads.map((lead, i) => <LeadRow key={lead.id} lead={lead} index={i} />)
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  main: {
    maxWidth: 1200, margin: '0 auto', padding: '24px 32px',
  },
  signOut: {
    background: '#171717', border: '1px solid #2A2A2A', borderRadius: 4,
    padding: '7px 14px', color: MUTED, fontFamily: BRAND_FONT,
    fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    cursor: 'pointer',
  },

  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 8 },
  eyebrow: { fontFamily: BRAND_FONT, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 500 },
  pageTitle: { fontFamily: BRAND_FONT, fontSize: 30, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '4px 0 0', color: '#fff' },
  dateLine: { fontFamily: BRAND_FONT, fontSize: 13, color: MUTED, marginTop: 4 },
  actions: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    fontFamily: BRAND_FONT, background: PANEL, border: '1px solid ' + LINE,
    borderRadius: 4, padding: '8px 14px', color: MUTED, fontSize: 12,
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
    cursor: 'pointer',
  },

  // KPI grid — matches Branding / Marketing (2x2 below lg, 4-wide at lg+)
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: KPI_GRADIENT, borderRadius: 12, padding: 20, border: '1px solid ' + LINE },
  statIcon: { width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 18, fontWeight: 700, fontFamily: BRAND_FONT },
  statLabel: { fontFamily: BRAND_FONT, fontSize: 11, color: MUTED, fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' },
  statValue: { fontFamily: BRAND_FONT, fontSize: 38, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 },
  statSub: { fontFamily: BRAND_FONT, fontSize: 12, color: '#555', marginTop: 6 },

  // Leads section card — same frame as Branding Clients card
  leadsCard: { background: CARD_GRADIENT, border: '1px solid ' + LINE, borderRadius: 12, overflow: 'hidden', marginBottom: 24 },
  leadsHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', flexWrap: 'wrap' },
  sectionTitle: { fontFamily: BRAND_FONT, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, color: '#fff' },
  filterWrap: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  filterLabel: { fontFamily: BRAND_FONT, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 },
  sortSelect: { fontFamily: BRAND_FONT, background: PANEL, border: '1px solid ' + LINE, borderRadius: 4, padding: '6px 10px', fontSize: 13, color: '#ccc', outline: 'none', cursor: 'pointer' },

  // Column header row above the lead list
  colHeaderRow: {
    display: 'grid', gridTemplateColumns: '44px 100px minmax(240px, 1fr) 160px',
    columnGap: 12, alignItems: 'center', padding: '12px 12px', background: PANEL,
  },
  colHead: { fontFamily: BRAND_FONT, fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'left' },
  colHeadCenter: { fontFamily: BRAND_FONT, fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' },
  colHeadR: { fontFamily: BRAND_FONT, fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' },

  // Lead row: grid matching the column header widths + gap + padding so
  // the # column / Source column land at the exact same x as the other apps'
  // client lists.
  leadRow: {
    display: 'grid', gridTemplateColumns: '44px 100px minmax(240px, 1fr) 160px',
    columnGap: 12, alignItems: 'flex-start', padding: '14px 12px',
    borderBottom: '1px solid ' + LINE, transition: 'background .12s ease',
  },
  numCell: { fontFamily: BRAND_FONT, fontSize: 12, color: MUTED, textAlign: 'center', fontVariantNumeric: 'tabular-nums', paddingTop: 3 },
  sourcePill: { fontFamily: BRAND_FONT, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.08em' },
  leadName: { fontFamily: BRAND_FONT, fontSize: 15, color: '#fff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' },
  leadSub: { fontFamily: BRAND_FONT, fontSize: 12, color: DIM, marginTop: 2, letterSpacing: '0.02em' },
  leadTimeCol: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 },
  timeAgo: { fontFamily: BRAND_FONT, fontSize: 11, color: MUTED, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.06em' },

  btnSecondary: {
    fontFamily: BRAND_FONT, background: PANEL, border: '1px solid ' + LINE,
    color: '#ccc', fontSize: 11, fontWeight: 700, padding: '4px 10px',
    borderRadius: 3, textDecoration: 'none', letterSpacing: '0.06em',
    textTransform: 'uppercase', whiteSpace: 'nowrap', textAlign: 'center',
  },
  btnLinkedin: {
    fontFamily: BRAND_FONT, background: '#0077B5',
    color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px',
    borderRadius: 3, textDecoration: 'none', letterSpacing: '0.06em',
    textTransform: 'uppercase', whiteSpace: 'nowrap', textAlign: 'center',
  },

  errorBox: {
    background: '#1a0000', border: '1px solid #3a0000', color: '#ff6b6b',
    fontFamily: BRAND_FONT, fontSize: 13, padding: '14px 18px', margin: '12px',
    borderRadius: 4,
  },
  empty: {
    fontFamily: BRAND_FONT, textAlign: 'center', color: MUTED,
    padding: '48px 24px', fontSize: 13, textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
};
