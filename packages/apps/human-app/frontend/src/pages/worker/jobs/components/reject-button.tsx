import CloseIcon from '@mui/icons-material/Close';
import type { CustomButtonProps } from '@/components/ui/button';
import { TableButton } from '@/components/ui/table-button';
import { useColorMode } from '@/hooks/use-color-mode';

export function RejectButton(props: CustomButtonProps) {
  const { colorPalette, isDarkMode } = useColorMode();

  return (
    <TableButton
      {...props}
      sx={{
        padding: '0.4rem',
        minWidth: 'unset',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colorPalette.primary.main,
        ...props.sx,
      }}
    >
      <CloseIcon
        sx={{
          fill: isDarkMode ? 'black' : undefined,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      />
    </TableButton>
  );
}
