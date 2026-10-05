import { useEffect, useState } from "react";

/**
 * POS terminals aren't all 16:9 landscape monitors — some are square
 * touchscreens (1024x1024, 1080x1080, 1280x1024, ...). This tracks the
 * live viewport aspect ratio (updates on resize) so a screen can switch
 * to a square-optimized layout instead of squeezing/stacking a
 * wide-screen layout into an aspect ratio it was never designed for.
 *
 * ~0.9–1.1 (width:height roughly 1:1) => square POS layout.
 * Anything wider or narrower keeps the existing layout.
 */
export function useIsSquareScreen(): boolean {
  const getIsSquare = () => {
    if (typeof window === "undefined") return false;
    const ratio = window.innerWidth / window.innerHeight;
    return ratio >= 0.9 && ratio <= 1.1;
  };

  const [isSquare, setIsSquare] = useState(getIsSquare);

  useEffect(() => {
    const onResize = () => setIsSquare(getIsSquare());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isSquare;
}
