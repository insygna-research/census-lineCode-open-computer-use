"use client";

import { useMemo } from "react";

interface MachineCardSmokeProps {
  machineId: string;
}

export function MachineCardSmoke({ machineId }: MachineCardSmokeProps) {
  // Generate random light purple and blue colors based on machineId
  const colors = useMemo(() => {
    const hash = machineId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Generate darker purple/blue/pink color schemes
    const baseHue = Math.abs(hash) % 80 + 250; // 250-330 range (blue-purple-pink)
    const hue1 = baseHue;
    const hue2 = (baseHue + 40) % 360;
    const hue3 = (baseHue - 40 + 360) % 360;
    
    return {
      primary: `hsl(${hue1}, 70%, 65%)`,    // Darker vibrant purple/blue
      secondary: `hsl(${hue2}, 65%, 60%)`,  // Darker vibrant accent
      tertiary: `hsl(${hue3}, 75%, 70%)`,   // Medium vibrant complement
    };
  }, [machineId]);

  return (
    <div className="w-full px-3 pt-0 pb-0">
      <div 
        className="h-20 w-full rounded-lg relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.tertiary})`,
        }}
      >
        {/* Animated smoke blobs */}
        <div className="absolute inset-0">
          <div 
            className="absolute w-32 h-32 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colors.secondary}DD, transparent)`,
              top: '-15px',
              left: '5%',
              animation: 'smoke1 2.5s ease-in-out infinite',
              filter: 'blur(20px)',
              opacity: 0.9,
            }}
          />
          <div 
            className="absolute w-40 h-40 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colors.primary}CC, transparent)`,
              top: '-25px',
              right: '0%',
              animation: 'smoke2 3s ease-in-out infinite',
              filter: 'blur(25px)',
              opacity: 0.8,
            }}
          />
          <div 
            className="absolute w-28 h-28 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colors.tertiary}EE, transparent)`,
              bottom: '-15px',
              left: '35%',
              animation: 'smoke3 2s ease-in-out infinite',
              filter: 'blur(18px)',
              opacity: 1,
            }}
          />
        </div>
      </div>
    </div>
  );
}