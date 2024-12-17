import { FC, ReactNode, useState, useRef, useEffect } from 'react';
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
  const tooltipRef = useRef<HTMLSpanElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      tooltipRef.current &&
      !tooltipRef.current.contains(event.target as Node)
    ) {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (mobile.isMobile) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [mobile.isMobile]);

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
      sx={{
        span: {
          display: 'inline-block',
        },
      }}
    >
      <span
        ref={tooltipRef}
        onClick={handleTooltipToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
    </Tooltip>
  );
};

export default TooltipMobileSup;
