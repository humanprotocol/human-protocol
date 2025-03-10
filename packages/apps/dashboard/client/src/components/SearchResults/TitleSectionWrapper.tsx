import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Typography from '@mui/material/Typography';
import { colorPalette } from '@assets/styles/color-palette';
import CustomTooltip from '@components/CustomTooltip';

const TitleSectionWrapper = ({
  title,
  children,
  tooltip,
}: {
  title: string;
  children: React.ReactNode;
  tooltip?: {
    description: string;
  };
}) => {
  return (
    <Stack
      alignItems={{ xs: 'start', md: 'center' }}
      gap={{ xs: 1, md: 0 }}
      direction={{ sm: 'column', md: 'row' }}
      sx={{ whiteSpace: 'nowrap' }}
    >
      {tooltip ? (
        <Stack
          sx={{
            width: 300,
          }}
          direction="row"
          alignItems="center"
        >
          <CustomTooltip title={tooltip.description}>
            <IconButton
              sx={{ padding: 0, paddingRight: 1, color: colorPalette.fog.main }}
            >
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </CustomTooltip>
          <Typography variant="subtitle2">{title}</Typography>
        </Stack>
      ) : (
        <Typography
          sx={{
            width: 300,
          }}
          variant="subtitle2"
        >
          {title}
        </Typography>
      )}
      {children}
    </Stack>
  );
};

export default TitleSectionWrapper;
