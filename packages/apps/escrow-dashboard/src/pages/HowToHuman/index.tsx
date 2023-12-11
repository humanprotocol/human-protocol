import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import howToHumanSvg from 'src/assets/how-to-human.svg';
import nextArrowSvg from 'src/assets/next-arrow.svg';
import prevArrowSvg from 'src/assets/prev-arrow.svg';
import { PageWrapper, ViewTitle } from 'src/components';
import HOW_TO_HUMAN_DATA from 'src/constants/how-to-human';

export const HowToHuman = () => {
  const [value, setValue] = useState(0);

  const config = HOW_TO_HUMAN_DATA[value];

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isUpMd = useMediaQuery(theme.breakpoints.up(944));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const renderButtonGroup = () => {
    if (isMobile)
      return (
        <>
          <Button
            color="primary"
            variant="contained"
            endIcon={<KeyboardArrowDownIcon />}
            fullWidth
            sx={{ my: 3 }}
            onClick={handleClick}
          >
            {config?.label}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            MenuListProps={{
              sx: { width: anchorEl && anchorEl.offsetWidth },
            }}
          >
            {HOW_TO_HUMAN_DATA.map((item, index) => (
              <MenuItem
                key={item.key}
                onClick={() => {
                  setValue(index);
                  handleClose();
                }}
              >
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      );

    return (
      <ToggleButtonGroup
        exclusive
        value={value}
        onChange={(e, newValue) => {
          if (newValue !== null) setValue(newValue);
        }}
        sx={{ my: 3 }}
        fullWidth={!isUpMd}
      >
        {HOW_TO_HUMAN_DATA.map((item, index) => (
          <ToggleButton key={item.key} value={index}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  };

  return (
    <PageWrapper>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <ViewTitle title="How To HUMAN" iconUrl={howToHumanSvg} />
        {renderButtonGroup()}
      </Box>
      <Box sx={{ py: { xs: 3, md: 10 } }}>
        <Typography
          color="primary"
          variant="h3"
          fontWeight={600}
          textAlign="center"
          mb={{ xs: 4, md: 8 }}
        >
          {config?.title}
        </Typography>
        <Box
          sx={{
            background: '#fff',
            borderRadius: '20px',
            maxWidth: '980px',
            width: '90%',
            mx: 'auto',
            p: 3,
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${config?.youtubeId}?rel=0&amp;controls=1&amp;autoplay=0&amp;mute=0&amp;start=0`}
            frameBorder={0}
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            title="Human Ops journey"
            style={{ width: '100%', height: '500px', borderRadius: '9px' }}
          ></iframe>
        </Box>
        {!isMobile && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mt: 6,
            }}
          >
            <Box
              sx={{ cursor: 'pointer' }}
              onClick={() => setValue(Math.max(0, value - 1))}
            >
              <img src={prevArrowSvg} />
            </Box>
            <Box
              sx={{ cursor: 'pointer' }}
              onClick={() =>
                setValue(Math.min(HOW_TO_HUMAN_DATA.length - 1, value + 1))
              }
            >
              <img src={nextArrowSvg} />
            </Box>
          </Box>
        )}
      </Box>
    </PageWrapper>
  );
};
