import { useState, useEffect } from "react";

export const useCursorBlink = (interval: number = 530, enabled: boolean = true) => {
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setShowCursor(true);
      return;
    }

    const id = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, interval);

    return () => clearInterval(id);
  }, [interval, enabled]);

  return showCursor;
};
