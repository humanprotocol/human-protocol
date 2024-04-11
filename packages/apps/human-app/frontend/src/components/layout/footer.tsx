import { Box, Link, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { colorPalette } from '@/styles/color-palette';
import { ChatIcon, DiscordIcon } from '../ui/icons';

export function Footer() {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: { xs: 'center', md: 'space-between' },
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            width: '100%',
            justifyContent: 'center',
            mb: '20px',
          }}
        >
          <Link href="#" underline="none">
            <GitHubIcon
              sx={{
                mr: '19px',
                fill: colorPalette.grey.light,
              }}
            />
          </Link>
          <Link href="#" underline="none">
            <DiscordIcon />
          </Link>
          <Link href="#" underline="none">
            <TwitterIcon
              sx={{
                mx: '19px',
                fill: colorPalette.grey.light,
              }}
            />
          </Link>
          <Link href="#" underline="none">
            <LinkedInIcon
              sx={{
                fill: colorPalette.grey.light,
              }}
            />
          </Link>
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Link
            color={colorPalette.grey.light}
            href="#"
            sx={{ mr: 1.5 }}
            underline="none"
          >
            <Typography variant="subtitle1">
              {t('components.footer.privacyPolicy')}
            </Typography>
          </Link>
          <Link
            color={colorPalette.grey.light}
            href="#"
            sx={{ mr: 1.5 }}
            underline="none"
          >
            <Typography variant="subtitle1">
              {t('components.footer.termsOfService')}
            </Typography>
          </Link>
          <Link color={colorPalette.grey.light} href="#" underline="none">
            <Typography variant="subtitle1">
              {t('components.footer.humanProtocol')}
            </Typography>
          </Link>
        </Box>
        <Typography align="center" variant="subtitle1">
          {t('components.footer.copyrightNote')}
        </Typography>
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <ChatIcon />
      </Box>
    </Box>
  );
}
