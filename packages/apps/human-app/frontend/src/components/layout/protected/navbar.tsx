import { IconButton, Stack } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { HumanLogoIcon } from '@/components/ui/icons';

interface NavbarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function Navbar({ setOpen, open }: NavbarProps) {
  return (
    <Stack
      alignItems="center"
      component="header"
      direction="row"
      justifyContent="space-between"
      sx={{
        display: { xs: 'flex', md: 'none' },
        width: '100%',
      }}
    >
      <Stack
        sx={{
          zIndex: '9999',
        }}
      >
        <HumanLogoIcon />
      </Stack>

      <IconButton
        onClick={() => {
          setOpen(!open);
        }}
        sx={{
          zIndex: '9999',
        }}
      >
        <MenuIcon />
      </IconButton>
    </Stack>
  );
}
