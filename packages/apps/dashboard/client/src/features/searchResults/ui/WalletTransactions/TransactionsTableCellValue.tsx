import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Typography from '@mui/material/Typography';

import { formatHMTDecimals } from '@/helpers/formatHMTDecimals';
import useHmtPrice from '@/shared/api/useHmtPrice';
import CustomTooltip from '@/shared/ui/CustomTooltip';

const InfoTooltip = ({ title }: { title: string }) => (
  <CustomTooltip title={title} arrow>
    <HelpOutlineIcon
      fontSize="small"
      sx={{
        color: 'text.secondary',
      }}
    />
  </CustomTooltip>
);

const TransactionsTableCellValue = ({
  value,
  method,
}: {
  value: string;
  method: string;
}) => {
  const { isError, isPending } = useHmtPrice();

  if (isError) {
    return <span>N/A</span>;
  }

  if (isPending) {
    return <span>...</span>;
  }

  return (
    <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
      {formatHMTDecimals(value)}
      <Typography variant="body2" component="span">
        HMT
      </Typography>
      {method === 'approve' && (
        <InfoTooltip title="Approved amount (not a transfer)" />
      )}
    </Typography>
  );
};

export default TransactionsTableCellValue;
