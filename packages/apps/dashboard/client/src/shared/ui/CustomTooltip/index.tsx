import Tooltip, { type TooltipProps } from '@mui/material/Tooltip';

const CustomTooltip = (props: TooltipProps) => {
  return <Tooltip enterTouchDelay={0} {...props} />;
};

export default CustomTooltip;
