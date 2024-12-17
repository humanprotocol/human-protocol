import { Stack } from '@mui/material';
import Typography from '@mui/material/Typography';

export function ModalExample() {
  return (
    <Stack
      alignItems="center"
      data-testid="example-modal"
      height="100%"
      justifyContent="center"
      width="100%"
    >
      <div>
        <Typography variant="h4">Example Modal</Typography>
        <Typography variant="body2">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Laborum
          adipisci minima libero voluptates molestiae eligendi fugiat quas,
          animi labore, perspiciatis quasi deleniti natus numquam laudantium
          debitis, officia nostrum ad dolore!
        </Typography>
      </div>
    </Stack>
  );
}
