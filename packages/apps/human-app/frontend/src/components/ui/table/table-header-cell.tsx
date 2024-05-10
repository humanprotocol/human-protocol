import React, { forwardRef, useState } from 'react';
import Popover from '@mui/material/Popover';
import type { TableCellBaseProps } from '@mui/material/TableCell/TableCell';

type HeaderCellProps = TableCellBaseProps & {
  popoverContent: React.ReactElement;
};

export const TableHeaderCell = forwardRef<
  HTMLTableDataCellElement,
  HeaderCellProps
>(function TableHeaderCell({ popoverContent, ...rest }, ref) {
  const [anchorEl, setAnchorEl] = useState<HTMLTableDataCellElement | null>(
    null
  );

  const handleClick = (event: React.MouseEvent<HTMLTableDataCellElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <>
      <td onClick={handleClick} {...rest} />
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        id={id}
        onClose={handleClose}
        open={open}
        ref={ref}
      >
        {popoverContent}
      </Popover>
    </>
  );
});

TableHeaderCell.displayName = 'TableHeaderCell';
