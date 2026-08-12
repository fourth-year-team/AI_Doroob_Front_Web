import React from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <span className="section-sub">{hint}</span>}
    </div>
  );
}
