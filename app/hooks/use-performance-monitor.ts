"use client";

import { useEffect } from "react";

export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only run in development
    if (process.env.NODE_ENV !== "development") return;

    const startTime = performance.now();

    // Monitor long tasks
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`[${componentName}] Long task detected:`, {
              duration: `${entry.duration.toFixed(2)}ms`,
              startTime: entry.startTime,
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ["longtask"] });
        return () => observer.disconnect();
      } catch (e) {
        // Long task observer not supported
      }
    }

    // Log mount time
    return () => {
      const mountTime = performance.now() - startTime;
      if (mountTime > 100) {
        console.warn(`[${componentName}] Slow mount: ${mountTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}