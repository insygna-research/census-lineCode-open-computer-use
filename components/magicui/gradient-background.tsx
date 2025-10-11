"use client";

import { cn } from "@/lib/utils";
import { themeConfig } from "@/lib/theme-config";
import React, { useEffect, useState } from "react";

interface GradientBackgroundProps {
  className?: string;
}

export function GradientBackground({ className }: GradientBackgroundProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mediaQuery.matches);

    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Use simpler background for mobile devices
  if (isMobile || reduceMotion) {
    return (
      <div className={cn("absolute inset-0 overflow-hidden", className)}>
        <div className="absolute inset-0">
          {/* Simple static gradient for mobile */}
          <div className="absolute inset-0">
            <div className={`absolute inset-0 bg-gradient-to-t ${themeConfig.gradients.background.mobile.base}`} />
            <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,${themeConfig.gradients.background.mobile.radial},transparent_50%)]`} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-background/5 to-background/30" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* Show across full height */}
      <div className="absolute inset-0">
        {/* Multiple smoke-like layers */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 1400 800"
        >
          <defs>
            {/* Smoke gradient 1 - very subtle */}
            <radialGradient id="smoke1" cx="30%" cy="70%" r="60%">
              <stop offset="0%" stopColor={themeConfig.gradients.background.smoke1.color} stopOpacity={themeConfig.gradients.background.smoke1.opacities[0]} />
              <stop offset="40%" stopColor={themeConfig.gradients.background.smoke1.color} stopOpacity={themeConfig.gradients.background.smoke1.opacities[1]} />
              <stop offset="100%" stopColor={themeConfig.gradients.background.smoke1.color} stopOpacity={themeConfig.gradients.background.smoke1.opacities[2]} />
            </radialGradient>
            
            {/* Smoke gradient 2 - ethereal blue */}
            <radialGradient id="smoke2" cx="70%" cy="60%" r="70%">
              <stop offset="0%" stopColor={themeConfig.gradients.background.smoke2.color} stopOpacity={themeConfig.gradients.background.smoke2.opacities[0]} />
              <stop offset="50%" stopColor={themeConfig.gradients.background.smoke2.color} stopOpacity={themeConfig.gradients.background.smoke2.opacities[1]} />
              <stop offset="100%" stopColor={themeConfig.gradients.background.smoke2.color} stopOpacity={themeConfig.gradients.background.smoke2.opacities[2]} />
            </radialGradient>
            
            {/* Smoke gradient 3 - purple blend */}
            <radialGradient id="smoke3" cx="50%" cy="80%" r="80%">
              <stop offset="0%" stopColor={themeConfig.gradients.background.smoke3.color} stopOpacity={themeConfig.gradients.background.smoke3.opacities[0]} />
              <stop offset="60%" stopColor={themeConfig.gradients.background.smoke3.color} stopOpacity={themeConfig.gradients.background.smoke3.opacities[1]} />
              <stop offset="100%" stopColor={themeConfig.gradients.background.smoke3.color} stopOpacity={themeConfig.gradients.background.smoke3.opacities[2]} />
            </radialGradient>
            
            {/* Smoke gradient 4 - vibrant teal mist */}
            <radialGradient id="smoke4" cx="30%" cy="50%" r="75%">
              <stop offset="0%" stopColor={themeConfig.gradients.background.smoke4?.color || "rgb(20, 184, 166)"} stopOpacity={themeConfig.gradients.background.smoke4?.opacities?.[0] || "0.38"} />
              <stop offset="50%" stopColor={themeConfig.gradients.background.smoke4?.color || "rgb(20, 184, 166)"} stopOpacity={themeConfig.gradients.background.smoke4?.opacities?.[1] || "0.22"} />
              <stop offset="100%" stopColor={themeConfig.gradients.background.smoke4?.color || "rgb(20, 184, 166)"} stopOpacity={themeConfig.gradients.background.smoke4?.opacities?.[2] || "0"} />
            </radialGradient>
            
            {/* Smoke gradient 5 - warm orange glow */}
            <radialGradient id="smoke5" cx="80%" cy="70%" r="65%">
              <stop offset="0%" stopColor={themeConfig.gradients.background.smoke5?.color || "rgb(251, 146, 60)"} stopOpacity={themeConfig.gradients.background.smoke5?.opacities?.[0] || "0.35"} />
              <stop offset="50%" stopColor={themeConfig.gradients.background.smoke5?.color || "rgb(251, 146, 60)"} stopOpacity={themeConfig.gradients.background.smoke5?.opacities?.[1] || "0.20"} />
              <stop offset="100%" stopColor={themeConfig.gradients.background.smoke5?.color || "rgb(251, 146, 60)"} stopOpacity={themeConfig.gradients.background.smoke5?.opacities?.[2] || "0"} />
            </radialGradient>

            {/* Less blur for much more visible and vibrant smoke */}
            <filter id="blur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
            </filter>
            <filter id="blur-heavy">
              <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
            </filter>
          </defs>
          
          {/* Smoke layer 1 - Blue smoke, balanced */}
          <ellipse
            cx="300"
            cy="200"
            rx="500"
            ry="400"
            fill="url(#smoke1)"
            filter="url(#blur-heavy)"
            className="animate-smoke-1-optimized"
          />
          
          {/* Smoke layer 2 - Pink smoke, balanced */}
          <ellipse
            cx="1100"
            cy="300"
            rx="500"
            ry="400"
            fill="url(#smoke2)"
            filter="url(#blur)"
            className="animate-smoke-2-optimized"
          />
          
          {/* Smoke layer 3 - Purple smoke, balanced */}
          <ellipse
            cx="700"
            cy="400"
            rx="500"
            ry="400"
            fill="url(#smoke3)"
            filter="url(#blur-heavy)"
            className="animate-smoke-2-optimized"
          />
          
          {/* Smoke layer 4 - Teal smoke, balanced */}
          <ellipse
            cx="200"
            cy="600"
            rx="500"
            ry="400"
            fill="url(#smoke4)"
            filter="url(#blur)"
            className="animate-smoke-3-optimized"
          />
          
          {/* Smoke layer 5 - Orange smoke, balanced */}
          <ellipse
            cx="1000"
            cy="600"
            rx="500"
            ry="400"
            fill="url(#smoke5)"
            filter="url(#blur)"
            className="animate-smoke-1-optimized"
          />
          
          {/* Additional layer - Blue for balance */}
          <ellipse
            cx="500"
            cy="500"
            rx="400"
            ry="350"
            fill="url(#smoke1)"
            filter="url(#blur)"
            className="animate-smoke-3-optimized"
          />
          
          {/* Additional layer - Teal for balance */}
          <ellipse
            cx="900"
            cy="250"
            rx="400"
            ry="350"
            fill="url(#smoke4)"
            filter="url(#blur)"
            className="animate-smoke-2-optimized"
          />
          
          {/* Additional layer - Orange for balance */}
          <ellipse
            cx="400"
            cy="400"
            rx="400"
            ry="350"
            fill="url(#smoke5)"
            filter="url(#blur-heavy)"
            className="animate-smoke-1-optimized"
          />
        </svg>
        
        {/* Simplified gradient overlays */}
        <div className="absolute inset-0">
          {/* Base gradient - very subtle */}
          <div className={`absolute inset-0 bg-gradient-to-t from-${themeConfig.gradients.background.base.from} via-${themeConfig.gradients.background.base.via} to-${themeConfig.gradients.background.base.to}`} />
          
          {/* Radial gradient for center glow */}
          <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,${themeConfig.gradients.background.radial},transparent_50%)]`} />
          
          {/* Reduced blur for better performance */}
          <div className={`absolute inset-0 bg-gradient-to-tr from-${themeConfig.gradients.background.blur.from} via-${themeConfig.gradients.background.blur.via} to-${themeConfig.gradients.background.blur.to} blur-3xl`} />
        </div>
        
        {/* Very minimal fade for edge blending only */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-background/5" />
      </div>
    </div>
  );
}