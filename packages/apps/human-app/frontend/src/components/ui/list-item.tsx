import { Typography, ListItem as MuiListItem } from '@mui/material';

export function ListItem({
  children,
  label,
}: {
  children: React.ReactElement;
  label: string;
}) {
  return (
    <MuiListItem
      sx={{
        paddingLeft: 0,
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        gap: '0.5rem',
      }}
    >
      <Typography variant="subtitle2">{label}</Typography>
      {children}
    </MuiListItem>
  );
}
