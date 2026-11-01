'use client';

import { useEffect } from 'react';
import DimensionRouter from '@/components/DimensionRouter';
import { audioManager } from '@/audio/AudioManager';

export default function Home() {
  useEffect(() => {
    audioManager.init();
    audioManager.preload('jumpscare');
  }, []);

  return <DimensionRouter />;
}
