import { useEffect, useState } from 'react';

/** True after mount — use to gate browser-only APIs (camera, speech, canvas). */
export function useClientOnly() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}
