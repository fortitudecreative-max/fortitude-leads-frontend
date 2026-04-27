import React, { useEffect, useRef } from 'react';

const HEADER_SCRIPT_URL = 'https://jv2.fortitudecreative.com/shared/fortitude-family-header.js';

function ensureHeaderScript() {
  if (window.FortitudeFamilyHeader) return Promise.resolve();
  if (window.__fortitudeFamilyHeaderPromise) return window.__fortitudeFamilyHeaderPromise;
  window.__fortitudeFamilyHeaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-fortitude-family-header-script]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Fortitude Family header failed to load')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = HEADER_SCRIPT_URL;
    script.async = true;
    script.dataset.fortitudeFamilyHeaderScript = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Fortitude Family header failed to load'));
    document.head.appendChild(script);
  });
  return window.__fortitudeFamilyHeaderPromise;
}

export default function Header({ activeApp, activeUnit, rightSlot }) {
  const rootRef = useRef(null);
  const active = (activeApp || activeUnit || '').trim();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    ensureHeaderScript()
      .then(() => window.FortitudeFamilyHeader?.mount(root))
      .catch(() => {
        root.innerHTML = '<div style="background:#d60000;color:#fff;padding:14px 18px;font-weight:700">Fortitude Family</div>';
      });
  }, [active]);

  return (
    <div
      ref={rootRef}
      data-fortitude-family-header
      data-active-app={active}
      data-logo-href="https://fortitudecreative.com/"
    >
      {rightSlot && <span slot="account">{rightSlot}</span>}
    </div>
  );
}
