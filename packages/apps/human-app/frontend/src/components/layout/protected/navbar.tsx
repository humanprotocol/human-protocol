import { IconButton, Stack } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { HumanLogoIcon } from '@/components/ui/icons';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useMobileDrawerFilterStore } from '@/hooks/use-mobile-drawer-filter-store';

interface NavbarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function Navbar({ setOpen, open }: NavbarProps) {
  const isMobile = useIsMobile();
  const { closeMobileFilterDrawer } = useMobileDrawerFilterStore();

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
        pt: isMobile ? '32px' : 0,
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
          if (open) {
            setOpen(false);
            closeMobileFilterDrawer();
          } else {
            setOpen(true);
          }
        }}
        sx={{
          zIndex: '9999',
        }}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </IconButton>
    </Stack>
  );
}
