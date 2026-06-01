import { Badge } from "@mantine/core";
import { useEffect, useState } from "react";

interface Props {
  expiresAt: number; // epoch ms
  onExpire: () => void;
}

/** Counts down to `expiresAt`, calling `onExpire` once it elapses. */
export default function CountdownTimer({ expiresAt, onExpire }: Props) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.round((expiresAt - Date.now()) / 1000))
  );

  useEffect(() => {
    const id = setInterval(() => {
      const secs = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(id);
        onExpire();
      }
    }, 250);
    return () => clearInterval(id);
  }, [expiresAt, onExpire]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <Badge color={remaining <= 30 ? "red" : "yellow"} variant="filled" radius="sm">
      ⏳ {mm}:{ss}
    </Badge>
  );
}
