export function MailTo({
  children,
  mail,
}: {
  children?: JSX.Element;
  mail: string;
}) {
  return (
    <a href={`mailto:${mail}`} style={{ color: 'inherit' }}>
      {children}
    </a>
  );
}
