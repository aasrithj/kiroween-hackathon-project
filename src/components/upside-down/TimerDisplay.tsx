'use client';

import { useAppStore } from '@/store/appStore';

export default function TimerDisplay() {
  const remaining = useAppStore((s) => s.timer.remainingSeconds);
  const isExpired = useAppStore((s) => s.timer.isExpired);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isUrgent = remaining < 10 && remaining > 0 && !isExpired;

  return (
    <div
      className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 px-6 py-3 rounded-lg bg-upsideDown-darkBlue/80 backdrop-blur border ${
        isUrgent ? 'border-upsideDown-danger timer-urgent' : 'border-upsideDown-grey/40'
      }`}
      role="timer"
      aria-label={`Time remaining: ${minutes} minutes and ${seconds} seconds`}
      aria-live="polite"
    >
      <span
        className={`text-3xl font-mono font-bold tracking-wider ${
          isUrgent ? 'text-upsideDown-danger' : 'text-upsideDown-fog/90'
        }`}
      >
        {timeStr}
      </span>
    </div>
  );
}
