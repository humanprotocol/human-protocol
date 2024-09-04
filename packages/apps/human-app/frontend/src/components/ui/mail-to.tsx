export function MailTo({
  children,
  mail,
}: {
  children?: JSX.Element;
  mail: string;
}) {
  return <a href={`mailto:${mail}`}>{children}</a>;
}
