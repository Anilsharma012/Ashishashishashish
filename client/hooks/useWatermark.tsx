import { useEffect } from "react";

/**
 * Watermark disabled: no-op hook.
 * Keeping the same export so imports elsewhere don't break.
 */
export function useWatermark() {
  useEffect(() => {
    /* intentionally empty */
  }, []);
}
export default useWatermark;
