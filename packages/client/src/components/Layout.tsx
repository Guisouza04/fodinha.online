import { ReactNode } from 'react';

export default function Layout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="layout">
      <header className="header">
        <h1 className="logo">Fodinha</h1>
        {title && <h2 className="page-title">{title}</h2>}
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
