import React from 'react';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = 'video', title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="es-icon">
        <Icon name={icon} size={22} />
      </div>
      <h4>{title}</h4>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
