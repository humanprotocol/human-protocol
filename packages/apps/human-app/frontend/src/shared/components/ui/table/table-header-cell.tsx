import React, { useState } from 'react';
import Popover from '@mui/material/Popover';
import type { TableCellBaseProps } from '@mui/material/TableCell/TableCell';
import { type IconType, TextHeaderWithIcon } from '../text-header-with-icon';

type CommonProps = TableCellBaseProps & {
  popoverContent: React.ReactElement;
};

type PropsWithIcon = CommonProps & {
  headerText: string;
  iconType: IconType;
};
type PropsWithoutIcon = CommonProps & {
  headerText?: never;
  iconType?: never;
};

type HeaderCellProps = PropsWithoutIcon | PropsWithIcon;

export function TableHeaderCell({
  popoverContent,
  headerText,
  iconType,
}: HeaderCellProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const handleClick = (
    event:
      | React.MouseEvent<HTMLDivElement>
      | React.KeyboardEvent<HTMLDivElement>
  ) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const getHeader = () => {
    if (!iconType) {
      return <div onClick={handleClick}>{headerText}</div>;
    }

    return (
      <div onClick={handleClick}>
        <TextHeaderWithIcon iconType={iconType} text={headerText} />
      </div>
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
      >
        {popoverContent}
      </Popover>
    </>
  );
}

TableHeaderCell.displayName = 'TableHeaderCell';
