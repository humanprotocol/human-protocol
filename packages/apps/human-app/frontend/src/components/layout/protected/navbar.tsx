import { IconButton, Stack } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { HumanLogoIcon } from '@/components/ui/icons';
import { useIsMobile } from '@/hooks/use-is-mobile';

interface NavbarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function Navbar({ setOpen, open }: NavbarProps) {
  const isMobile = useIsMobile();

  return (
    <Stack
      alignItems="center"
      component="header"
      direction="row"
      justifyContent="space-between"
      sx={{
        display: { xs: 'flex', md: 'none' },
        width: '100%',
        px: isMobile ? '44px' : 0,
        py: isMobile ? '32px' : 0,
        zIndex: '1300',
        position: open ? 'sticky' : 'relative',
        top: open ? '0' : 'unset',
      }}
    >
      <HumanLogoIcon />

      <IconButton
        onClick={() => {
          setOpen(!open);
        }}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </IconButton>
    </Stack>
  );
}
