"use client";

import { useEffect, useState } from "react";

/**
 * Live Curitiba (America/Sao_Paulo) time, formatted HH:MM:SS in 24h.
 * Updates every second on the client. Returns "--:--:--" before hydration.
 */
export function useLiveTime(): string {
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "America/Sao_Paulo",
        }),
      );
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  return time;
}

export default useLiveTime;
