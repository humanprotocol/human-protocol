import { Paper, Stack } from '@mui/material';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { OraclesTableJobTypesSelect, OraclesTable } from './components';

export function JobsDiscoveryPage() {
  const isMobile = useIsMobile();

  return (
    <Stack sx={{ alignItems: 'center', justifyContent: 'center' }}>
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          height: '100%',
          padding: isMobile ? '20px' : '64px 144px',
          minHeight: '800px',
          borderRadius: '20px',
        }}
      >
        <OraclesTableJobTypesSelect />
        <OraclesTable />
      </Paper>
    </Stack>
  );
}
