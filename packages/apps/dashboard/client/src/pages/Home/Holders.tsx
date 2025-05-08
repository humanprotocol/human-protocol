import { FormatNumber } from '@components/Home/FormatNumber';
import Typography from '@mui/material/Typography';
import { useGeneralStats } from '@services/api/use-general-stats';

export function Holders() {
  const { data, isSuccess, isPending, isError } = useGeneralStats();

  return (
    <div>
      <Typography variant="body1" component="p">
        Holders
      </Typography>
      <div className="count">
        {isSuccess && <FormatNumber value={data.totalHolders} />}
        {isPending && '...'}
        {isError && 'No data'}
      </div>
    </div>
  );
}
