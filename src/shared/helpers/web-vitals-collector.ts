/**
 * Injected into the page — collects FCP, LCP, CLS, TBT via PerformanceObserver API.
 * Must be fully self-contained (no external imports).
 */
export function collectPageWebVitals(): Promise<{
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  tbt: number | null;
}> {
  return new Promise(resolve => {
    const COLLECT_TIMEOUT = 10_000;

    const result: {
      fcp: number | null;
      lcp: number | null;
      cls: number | null;
      tbt: number | null;
    } = {
      fcp: null,
      lcp: null,
      cls: null,
      tbt: null,
    };

    let clsValue = 0;
    let tbtValue = 0;

    /* ── FCP: check already available entries, fall back to observer ── */
    const paintEntries = performance.getEntriesByType('paint');
    for (const entry of paintEntries) {
      if (entry.name === 'first-contentful-paint') {
        result.fcp = entry.startTime;
        break;
      }
    }

    if (result.fcp === null) {
      try {
        const fcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              result.fcp = entry.startTime;
              fcpObserver.disconnect();
              break;
            }
          }
        });
        fcpObserver.observe({ type: 'paint', buffered: true });
      } catch {
        /* FCP not available */
      }
    }

    /* ── LCP ── */
    const lcpObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        result.lcp = entries[entries.length - 1].startTime;
      }
    });
    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      /* LCP not available */
    }

    /* ── CLS ── */
    const clsObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      for (const entry of entries) {
        const shift = entry as unknown as { hadRecentInput: boolean; value: number };
        if (!shift.hadRecentInput) {
          clsValue += shift.value;
        }
      }
      result.cls = clsValue;
    });
    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      result.cls = 0; // observer succeeded — no entries means CLS is genuinely 0
    } catch {
      /* CLS not available */
    }

    /* ── TBT: sum of (duration - 50) for long tasks ── */
    const tbtObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      for (const entry of entries) {
        const blockingTime = entry.duration - 50;
        if (blockingTime > 0) {
          tbtValue += blockingTime;
        }
      }
      result.tbt = tbtValue;
    });
    try {
      tbtObserver.observe({ type: 'longtask' });
      result.tbt = 0;
    } catch {
      /* TBT not available */
    }

    /* ── Poll for early resolve once FCP + LCP are captured ── */
    const checkInterval = setInterval(() => {
      if (result.fcp !== null && result.lcp !== null) {
        clearInterval(checkInterval);
        lcpObserver.disconnect();
        clsObserver.disconnect();
        tbtObserver.disconnect();
        resolve(result);
      }
    }, 500);

    /* ── Fallback timeout ── */
    setTimeout(() => {
      clearInterval(checkInterval);
      lcpObserver.disconnect();
      clsObserver.disconnect();
      tbtObserver.disconnect();
      resolve(result);
    }, COLLECT_TIMEOUT);
  });
}
