import type { CustomButtonProps } from '@/shared/components/ui/button';
import { Button } from '@/shared/components/ui/button';

export function TableButton(props: CustomButtonProps) {
  return (
    <Button
      {...props}
      size="small"
      type="button"
      variant="contained"
      color="secondary"
      sx={{
        paddingTop: '0.4rem',
        paddingBottom: '0.4rem',
        whiteSpace: 'nowrap',
        textWrap: 'nowrap',
        fontSize: '13px',
        ...props.sx,
      }}
    >
      <div>{props.children}</div>
    </Button>
  );
}
