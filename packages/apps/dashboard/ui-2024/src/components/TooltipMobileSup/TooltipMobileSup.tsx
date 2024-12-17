import { FC, ReactNode, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';

interface TooltipMobileSupProps {
  title: string;
  children: ReactNode;
  arrow?: boolean;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const TooltipMobileSup: FC<TooltipMobileSupProps> = ({
  title,
  children,
  arrow = true,
  placement = undefined,
}) => {
  const { mobile } = useBreakPoints();
  const [open, setOpen] = useState<boolean>(false);

  const handleTooltipToggle = () => {
    if (mobile.isMobile) {
      setOpen((prev) => !prev);
    }
  };

  const handleMouseEnter = () => {
    if (!mobile.isMobile) {
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!mobile.isMobile) {
      setOpen(false);
    }
  };

  return (
    <Tooltip
      title={title}
      arrow={arrow}
      open={open}
      disableHoverListener={mobile.isMobile}
      placement={placement}
    >
      <span
        onClick={handleTooltipToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'inline-block' }}
      >
        {children}
      </span>
    </Tooltip>
  );
};

export default TooltipMobileSup;
