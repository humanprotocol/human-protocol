import React, { forwardRef, useState } from 'react';
import Popover from '@mui/material/Popover';
import type { TableCellBaseProps } from '@mui/material/TableCell/TableCell';
import type { IconType } from '@/pages/worker/jobs/components/text-header-with-icon';
import { TextHeaderWithIcon } from '@/pages/worker/jobs/components/text-header-with-icon';

type CommonProps = TableCellBaseProps & {
  popoverContent: React.ReactElement;
};

type PropsWithIcon = CommonProps & {
  iconText: string;
  iconType: IconType;
};
type PropsWithoutIcon = CommonProps & {
  iconText?: never;
  iconType?: never;
};

type HeaderCellProps = PropsWithoutIcon | PropsWithIcon;

export const TableHeaderCell = forwardRef<
  HTMLTableDataCellElement,
  HeaderCellProps
>(function TableHeaderCell(
  { popoverContent, iconText, iconType, ...rest },
  ref
) {
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

  const getHeader = () => {
    if (!iconType) {
      return <td onClick={handleClick} {...rest} />;
    }
    return (
      <td onClick={handleClick} {...rest}>
        <TextHeaderWithIcon iconType={iconType} text={iconText} />
      </td>
    );
  };

  return (
    <>
      {getHeader()}
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
