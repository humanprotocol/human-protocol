import { Tooltip, TooltipProps } from '@mui/material';

const CustomTooltip = (props: TooltipProps) => {
  return <Tooltip enterTouchDelay={0} {...props} />;
};

export default CustomTooltip;
