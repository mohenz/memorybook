import React from 'react';

interface MobileEmptyStateProps {
  message: string;
}

export default function MobileEmptyState({ message }: MobileEmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <p className="text-sm font-medium text-on-surface-variant text-center">{message}</p>
    </div>
  );
}
