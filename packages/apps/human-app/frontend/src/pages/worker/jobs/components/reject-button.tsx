import CloseIcon from '@mui/icons-material/Close';
import type { CustomButtonProps } from '@/components/ui/button';
import { TableButton } from '@/components/ui/table-button';
import { colorPalette } from '@/styles/color-palette';

export function RejectButton(props: CustomButtonProps) {
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
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      />
    </TableButton>
  );
}
