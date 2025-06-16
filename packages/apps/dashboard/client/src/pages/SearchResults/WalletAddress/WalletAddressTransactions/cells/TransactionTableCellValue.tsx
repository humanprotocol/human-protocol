import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Typography from '@mui/material/Typography';

import CustomTooltip from '@/components/CustomTooltip';
import { formatHMTDecimals } from '@/helpers/formatHMTDecimals';
import { useHMTPrice } from '@/services/api/use-hmt-price';

const InfoTooltip = ({ title }: { title: string }) => (
  <CustomTooltip title={title}>
    <HelpOutlineIcon
      fontSize="small"
      sx={{
        color: 'text.secondary',
        ml: 0.5,
      }}
    />
  </CustomTooltip>
);

export const TransactionTableCellValue = ({
  value,
  method,
}: {
  value: string;
  method: string;
}) => {
  const { isError, isPending } = useHMTPrice();

  if (isError) {
    return <span>N/A</span>;
  }

  if (isPending) {
    return <span>...</span>;
  }

  return (
    <Typography display="flex" alignItems="center">
      {formatHMTDecimals(value)}
      <Typography component="span"> HMT</Typography>
      {method === 'approve' && (
        <InfoTooltip title="Approved amount (not a transfer)" />
      )}
    </Typography>
  );
};
