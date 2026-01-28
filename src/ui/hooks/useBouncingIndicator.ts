import { useState, useEffect, useRef } from "react";

export const useBouncingIndicator = (width: number = 20, speed: number = 50, enabled: boolean = true) => {
  const [position, setPosition] = useState(0);
  const directionRef = useRef(1);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setPosition((prev) => {
        const next = prev + directionRef.current;
        if (next >= width - 1) {
          directionRef.current = -1;
          return width - 1;
        }
        if (next <= 0) {
          directionRef.current = 1;
          return 0;
        }
        return next;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [width, speed, enabled]);

  return position;
};
