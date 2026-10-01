import { useLayoutEffect, useRef, useState } from "react";
import { initializeArchive } from "./archive-controller";
import { archiveMarkup, archiveStyles } from "./archive-document";

export default function App() {
  const cleanupRef = useRef<(() => void) | null>(null);
  const [startupError, setStartupError] = useState(false);

  useLayoutEffect(() => {
    try {
      cleanupRef.current = initializeArchive();
    } catch (error) {
      console.error("ResQSync could not initialize:", error);
      setStartupError(true);
    }
    return () => cleanupRef.current?.();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: archiveStyles }} />
      <div id="resqsync-app" dangerouslySetInnerHTML={{ __html: archiveMarkup }} />
      {startupError && (
        <div className="archive-error" role="alert">
          The workspace could not initialize. Your saved demo data has not been changed.
          <button type="button" onClick={() => window.location.reload()}>Reload workspace</button>
        </div>
      )}
    </>
  );
}