import Paper from '@mui/material/Paper';
import { FormExample } from '@/components/data-entry/form-example';
import { UiExample } from '@/components/ui/ui-example';

export function Playground() {
  return (
    <Paper
      sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}
      variant="outlined"
    >
      <UiExample />
      <h2>Form</h2>
      <FormExample />
    </Paper>
  );
}
