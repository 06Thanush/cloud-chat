import React from 'react';

interface BadgeProps {
  count: number;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ count, className = '' }) => {
  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-emerald-500 rounded-full shadow-sm min-w-[20px] h-[20px] ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
