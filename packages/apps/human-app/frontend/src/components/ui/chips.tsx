import { Stack } from '@mui/material';
import { Chip } from '@/components/ui/chip';

interface ChipsProps {
  data: string[];
}

export function Chips({ data }: ChipsProps) {
  return (
    <Stack direction="row" spacing={1}>
      {data.map((jobType) => (
        <Chip key={crypto.randomUUID()} label={jobType} />
      ))}
    </Stack>
  );
}
