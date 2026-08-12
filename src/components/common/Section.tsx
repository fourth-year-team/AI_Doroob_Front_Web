import React from 'react';

interface SectionProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function Section({ title, subtitle, actions, children }: SectionProps) {
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-sub">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
