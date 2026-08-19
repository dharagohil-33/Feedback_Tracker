'use client';

import React from 'react';
import LiquidEther, { LiquidEtherProps } from './LiquidEther';

export type MoltenMetalColorMode = 'molten' | 'ember' | 'frost';

export interface MoltenMetalProps {
  color1?: string;
  color2?: string;
  color3?: string;
  speed?: number;
  scale?: number;
  detail?: number;
  glow?: number;
  coreSize?: number;
  swirl?: number;
  fold?: number;
  blackPoint?: number;
  brightness?: number;
  colorMode?: MoltenMetalColorMode;
  grain?: boolean;
  grainIntensity?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  opacity?: number;
  className?: string;
}

export const MoltenMetal: React.FC<MoltenMetalProps> = ({
  color1 = '#4F46E5',
  color2 = '#06B6D4',
  color3 = '#312E81',
  className = ''
}) => {
  return (
    <LiquidEther
      colors={[color1, color2, color3]}
      mouseForce={20}
      cursorSize={100}
      isViscous={true}
      viscous={30}
      iterationsViscous={32}
      iterationsPoisson={32}
      resolution={0.5}
      isBounce={false}
      autoDemo={true}
      autoSpeed={0.5}
      autoIntensity={2.2}
      takeoverDuration={0.25}
      autoResumeDelay={3000}
      autoRampDuration={0.6}
      className={className}
    />
  );
};

export default MoltenMetal;
