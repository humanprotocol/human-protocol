import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Typography from '@mui/material/Typography';

import formatTokenDecimals from '@/shared/lib/formatTokenDecimals';
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
  tokenSymbol,
}: {
  value: string;
  method: string;
  tokenSymbol?: string | null;
}) => {
  return (
    <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
      {Number(value) === 0 && !tokenSymbol ? (
        '-'
      ) : (
        <>
          {formatTokenDecimals(value)}
          <Typography variant="body2" component="span">
            {tokenSymbol}
          </Typography>
        </>
      )}
      {method === 'approve' && (
        <InfoTooltip title="Approved amount (not a transfer)" />
      )}
    </Typography>
  );
};

export default TransactionsTableCellValue;
