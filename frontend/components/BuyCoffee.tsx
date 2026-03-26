'use client';

import { useEffect, useState } from 'react';

export function BuyCoffee() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/bmc')
      .then(res => res.json())
      .then(data => {
        if (typeof data.count === 'number') {
          setCount(data.count);
        }
      })
      .catch(err => console.error('Failed to load coffee count', err));
  }, []);

  return (
    <a
      href="https://www.buymeacoffee.com/hackerney"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow-lg overflow-hidden transition-transform hover:scale-105"
      style={{
        background: 'linear-gradient(135deg, #ff6b35 0%, #f7c59f 50%, #ff6b35 100%)',
        backgroundSize: '200% auto',
      }}
    >
      {/* Shimmer sweep on hover */}
      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', transform: 'skewX(-20deg)' }} />

      <span className="relative text-xl group-hover:rotate-12 transition-transform duration-200 select-none">🍕</span>
      <span className="relative text-white drop-shadow-sm">Buy me a pizza</span>
      {count !== null && count > 0 && (
        <span className="relative bg-white/20 border border-white/30 text-white px-2 py-0.5 rounded-full text-sm ml-1 backdrop-blur-sm">
          {count}
        </span>
      )}
    </a>
  );
}
