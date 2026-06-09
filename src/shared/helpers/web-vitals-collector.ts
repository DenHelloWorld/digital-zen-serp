/**
 * Injected into the page — collects Core Web Vitals + Navigation Timing.
 * Must be fully self-contained (no external imports).
 */
export function collectPageWebVitals(): Promise<{
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  tbt: number | null;
  ttfb: number | null;
  dnsLookup: number | null;
  tcpConnect: number | null;
  domInteractive: number | null;
  domContentLoaded: number | null;
  domComplete: number | null;
}> {
  return new Promise(resolve => {
    const COLLECT_TIMEOUT = 10_000;

    const result = {
      fcp: null as number | null,
      lcp: null as number | null,
      cls: null as number | null,
      tbt: null as number | null,
      ttfb: null as number | null,
      dnsLookup: null as number | null,
      tcpConnect: null as number | null,
      domInteractive: null as number | null,
      domContentLoaded: null as number | null,
      domComplete: null as number | null,
    };

    let clsValue = 0;
    let tbtValue = 0;

    /* ── Navigation Timing (synchronous, always available) ── */
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      const nav = navEntries[0];
      result.ttfb = nav.responseStart;
      result.dnsLookup = nav.domainLookupEnd - nav.domainLookupStart;
      result.tcpConnect = nav.connectEnd - nav.connectStart;
      result.domInteractive = nav.domInteractive;
      result.domContentLoaded = nav.domContentLoadedEventEnd;
      result.domComplete = nav.domComplete;
    }

    /* ── FCP ── */
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
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              result.fcp = entry.startTime;
              fcpObserver.disconnect();
              break;
            }
          }
        });
        fcpObserver.observe({ type: 'paint', buffered: true });
      } catch {
        /* not available */
      }
    }

    /* ── LCP ── */
    const lcpObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      if (entries.length > 0) result.lcp = entries[entries.length - 1].startTime;
    });
    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      /* not available */
    }

    /* ── CLS ── */
    const clsObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const shift = entry as unknown as { hadRecentInput: boolean; value: number };
        if (!shift.hadRecentInput) clsValue += shift.value;
      }
      result.cls = clsValue;
    });
    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      result.cls = 0;
    } catch {
      /* not available */
    }

    /* ── TBT ── */
    const tbtObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const blockingTime = entry.duration - 50;
        if (blockingTime > 0) tbtValue += blockingTime;
      }
      result.tbt = tbtValue;
    });
    try {
      tbtObserver.observe({ type: 'longtask' });
      result.tbt = 0;
    } catch {
      /* not available */
    }

    /* ── Early resolve once FCP + LCP captured ── */
    const checkInterval = setInterval(() => {
      if (result.fcp !== null && result.lcp !== null) {
        clearInterval(checkInterval);
        lcpObserver.disconnect();
        clsObserver.disconnect();
        tbtObserver.disconnect();
        resolve(result);
      }
    }, 500);

    setTimeout(() => {
      clearInterval(checkInterval);
      lcpObserver.disconnect();
      clsObserver.disconnect();
      tbtObserver.disconnect();
      resolve(result);
    }, COLLECT_TIMEOUT);
  });
}
