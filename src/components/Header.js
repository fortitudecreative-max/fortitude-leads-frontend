// Fortitude shared header — identical look across all apps (Leads, Branding, Marketing, SEO, PPC).
// Mirrors the header on admin.fortitudecreative.com. Uses plain inline styles so any React
// app can drop it in without needing Tailwind. Keep this file in sync across repos.
//
// Mobile layout: logo on the LEFT, hamburger on the RIGHT. The hamburger dropdown
// contains both the unit navigation and the rightSlot content (e.g. Sign out).
import React, { useEffect, useState } from 'react';

const BG = '#111111';
const LINE = '#2A2A2A';
const TEXT = '#F5F5F5';
const MUTED = '#8A8A8A';
const ACCENT = '#D60000';

const UNITS = [
  { label: 'LEADS',     href: 'https://leads.fortitudecreative.com' },
  { label: 'BRANDING',  href: 'https://branding.fortitudecreative.com' },
  { label: 'MARKETING', href: 'https://marketing.fortitudecreative.com' },
  { label: 'SEO',       href: 'https://seo.fortitudecreative.com' },
  { label: 'PPC',       href: 'https://ppc.fortitudecreative.com' }
];

function NavLink({ label, href, active }) {
  const [hover, setHover] = useState(false);
  const isOn = active || hover;
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        padding: '6px 2px',
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: '0.04em',
        color: isOn ? TEXT : MUTED,
        textDecoration: 'none',
        transition: 'color .15s ease',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      {label}
      {active && (
        <span style={{
          position: 'absolute', left: 0, right: 0, bottom: -10,
          height: 2, background: ACCENT
        }} />
      )}
    </a>
  );
}

export default function Header({ activeUnit, rightSlot }) {
  const [menu, setMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <header
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, padding: isMobile ? '0 12px' : '0 24px',
        height: isMobile ? 80 : 128,
        borderBottom: '1px solid ' + LINE,
        background: BG,
        position: 'sticky', top: 0, zIndex: 30,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      {/* LEFT: logo (always) + desktop nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 16 : 32, minWidth: 0 }}>
        <a href="https://admin.fortitudecreative.com" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <img
            src="https://fortitudecreative.com/wp-content/uploads/2025/04/Fortitude-Logo32.svg"
            alt="Fortitude Creative"
            style={{ height: isMobile ? 64 : 110, width: 'auto', display: 'block' }}
          />
        </a>
        {!isMobile && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {UNITS.map((u) => (
              <NavLink key={u.label} label={u.label} href={u.href} active={activeUnit === u.label} />
            ))}
          </nav>
        )}
      </div>

      {/* RIGHT: desktop right-slot OR mobile hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {!isMobile && rightSlot}
        {isMobile && (
          <button
            onClick={() => setMenu((m) => !m)}
            aria-label="Open menu"
            style={{
              width: 40, height: 40, borderRadius: 4,
              background: '#171717', border: '1px solid ' + LINE,
              color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Mobile drawer */}
      {isMobile && menu && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
          onClick={() => setMenu(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 288,
              background: BG, borderLeft: '1px solid ' + LINE,
              padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 4,
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px 12px', borderBottom: '1px solid ' + LINE, marginBottom: 8 }}>
              <span style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: MUTED }}>Menu</span>
              <button onClick={() => setMenu(false)} style={{ background: 'transparent', border: 'none', color: MUTED, fontSize: 24, cursor: 'pointer', padding: 4 }}>×</button>
            </div>
            <div style={{ padding: '0 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: MUTED, marginBottom: 8 }}>SECTIONS</div>
            {UNITS.map((u) => {
              const isActive = activeUnit === u.label;
              return (
                <a
                  key={u.label}
                  href={u.href}
                  onClick={() => setMenu(false)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 4,
                    fontSize: 15, fontWeight: 600, letterSpacing: '0.04em',
                    color: isActive ? TEXT : MUTED,
                    textDecoration: 'none',
                    background: isActive ? 'rgba(214,0,0,0.15)' : 'transparent',
                    boxShadow: isActive ? 'inset 3px 0 0 ' + ACCENT : 'none'
                  }}
                >
                  {u.label}
                  {isActive && <span style={{ fontSize: 10, color: ACCENT, fontWeight: 700 }}>CURRENT</span>}
                </a>
              );
            })}

            {rightSlot && (
              <div style={{
                marginTop: 'auto', paddingTop: 16, borderTop: '1px solid ' + LINE,
                display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 12px'
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: MUTED }}>ACCOUNT</div>
                {rightSlot}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
