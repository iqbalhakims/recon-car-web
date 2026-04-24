import { useEffect } from 'react';

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}

export default function useVisitorTrack() {
  useEffect(() => {
    // Skip if logged in as admin
    if (localStorage.getItem('crm_token')) return;

    let session_id = localStorage.getItem('visitor_session');
    if (!session_id) {
      session_id = uuidv4();
      localStorage.setItem('visitor_session', session_id);
    }

    fetch('/api/visitors/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id }),
    }).catch(() => {});
  }, []);
}
