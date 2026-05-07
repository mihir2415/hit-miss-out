import { useEffect, useRef, useState, useCallback } from 'react';

export function useTimer(seconds: number, onExpire: () => void, active: boolean) {
  const [remaining, setRemaining] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const reset = useCallback(() => setRemaining(seconds), [seconds]);

  useEffect(() => {
    if (!active) return;
    if (remaining <= 0) {
      onExpireRef.current();
      return;
    }
    const id = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(id);
  }, [active, remaining]);

  return { remaining, reset };
}
