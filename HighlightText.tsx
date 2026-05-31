import React from 'react';

interface HighlighterProps {
  text: string;
  query: string;
}

export function HighlightText({ text, query }: HighlighterProps) {
  if (!text) return null;
  if (!query || !query.trim()) return <>{text}</>;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={index} className="bg-yellow-400 text-black px-0.5 rounded shadow-[0_0_8px_rgba(250,204,21,0.8)] font-bold transition-all duration-300">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
}
