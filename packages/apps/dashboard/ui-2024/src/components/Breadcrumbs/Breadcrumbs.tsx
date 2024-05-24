import { FC }  from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

const Breadcrumbs: FC<{ title?: string }> = ({ title }) => {
  return (
    <div className='breadcrumbs'>
      <Link href="/" underline="none">
        <Typography component="span" fontSize={16} color="text.secondary">
          Dashboard
        </Typography>
      </Link>
      <KeyboardArrowRightIcon color="primary" />
      <Typography component="span" fontSize={16} color="primary">
        {title}
      </Typography>
    </div>
  );
};

export default Breadcrumbs;