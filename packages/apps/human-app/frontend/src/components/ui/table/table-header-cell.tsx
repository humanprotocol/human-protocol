/* eslint-disable jsx-a11y/click-events-have-key-events -- not necessary */
/* eslint-disable jsx-a11y/no-static-element-interactions -- not necessary */
import Popover from '@mui/material/Popover';
import type { TableCellBaseProps } from '@mui/material/TableCell/TableCell';
import { useState } from 'react';

type HeaderCellProps = TableCellBaseProps & {
  popoverContent: React.ReactElement;
};

export function TableHeaderCell({ popoverContent, ...rest }: HeaderCellProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <>
      <div onClick={handleClick} {...rest} />
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        id={id}
        onClose={handleClose}
        open={open}
      >
        {popoverContent}
      </Popover>
    </>
  );
}
