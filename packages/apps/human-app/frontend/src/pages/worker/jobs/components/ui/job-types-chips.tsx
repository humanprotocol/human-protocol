import { Stack } from '@mui/material';
import { ChipComponent } from '@/components/ui/chip-component';

interface JobTypesChipsProps {
  data: string[];
}

export function JobTypesChips({ data }: JobTypesChipsProps) {
  return (
    <Stack direction="row" spacing={1}>
      {data.map((jobType) => (
        <ChipComponent key={crypto.randomUUID()} label={jobType} />
      ))}
    </Stack>
  );
}
