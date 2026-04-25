'use client';
import { useState } from 'react';

export function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <button
      onClick={copy}
      className="group flex items-center gap-3 bg-panel border border-white/10 hover:border-accent/60 rounded-lg px-5 py-3 font-mono text-lg transition"
      title="Кликни чтобы скопировать"
    >
      <span className="text-accent">{address}</span>
      <span className="text-xs text-white/50 group-hover:text-white/80">
        {copied ? '✓ скопировано' : 'клик — копировать'}
      </span>
    </button>
  );
}
