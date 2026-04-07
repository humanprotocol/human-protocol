import type { ReactNode } from 'react';

export function MailTo({
  children,
  mail,
}: {
  children?: ReactNode;
  mail: string;
}) {
  return (
    <a href={`mailto:${mail}`} style={{ color: 'inherit' }}>
      {children}
    </a>
  );
}
