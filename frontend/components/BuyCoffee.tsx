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
      className="group inline-flex items-center gap-2 bg-[#FF5F5F] text-black px-4 py-2 rounded-full font-bold hover:bg-[#FFEA5C] transition-all hover:scale-105 shadow-lg"
    >
      <span className="text-xl group-hover:animate-bounce">☕</span>
      <span>Buy me a chai</span>
      {count !== null && count > 0 && (
        <span className="bg-black/10 px-2 py-0.5 rounded-full text-sm ml-1 border border-black/5">
          {count}
        </span>
      )}
    </a>
  );
}
