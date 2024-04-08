import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { colorPalette } from '@/styles/color-palette';
import { MODAL_STATE, useModalStore } from '@/components/ui/modal/modal.store';
import { Modal } from '@/components/ui/modal/modal';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import {
  ConversionIcon,
  ConversionPurpleIcon,
  FileIcon,
  HandsIcon,
  HumanLogoIcon,
  RefreshIcon,
  ShadowFileIcon,
  ShadowHumanLogoIcon,
  ShadowUserIcon,
  ShadowHandIcon,
  UserIcon,
  WhiteUserIcon,
  EllipseUserIcon,
  EllipseHumanLogoIcon,
  EllipseFileIcon,
  InfoIcon,
  ProfileIcon,
  BackArrowMobileIcon,
  BackArrowDesktopIcon,
} from '@/components/ui/icons';

export function UiExample() {
  const { openModal, isModalOpen, closeModal } = useModalStore();
  return (
    <div>
      <Typography sx={{ marginBottom: '10px' }} variant="h1">
        Fonts
      </Typography>

      <Typography
        color={colorPalette.error.main}
        sx={{ marginBottom: 2 }}
        variant="h3"
      >
        IMPORTANT - To use Header 1 - 5 you have to add into Typography a prop
        component
      </Typography>

      <Stack gap={3} sx={{ marginBottom: 4 }}>
        <Typography component="p" variant="h1">
          H1 / Roboto Medium 56
        </Typography>

        <Typography component="p" variant="h2">
          H2 / Roboto Medium 36
        </Typography>

        <Typography component="p" variant="h3">
          H3 / Roboto Bold 28
        </Typography>

        <Typography component="p" variant="h4">
          H4 / Roboto Medium 24
        </Typography>

        <Typography component="p" variant="h5">
          H5 / Roboto Medium 20
        </Typography>

        <Typography variant="text_field">
          Text field / Roboto Regular 16
        </Typography>

        <Typography variant="body1">Body 1 / Roboto Regular 14</Typography>

        <Typography variant="body2">Body 2 / Roboto Medium 14</Typography>

        <Typography variant="subtitle1">
          Subtitle 1 / Roboto Regular 12
        </Typography>

        <Typography variant="subtitle2">
          Subtitle 2 / Roboto Medium 12
        </Typography>
      </Stack>

      <h2>Buttons</h2>
      <Stack direction="row" spacing={2}>
        <Button variant="text">Text</Button>
        <Button variant="contained">Contained</Button>
        <Button variant="outlined">Outlined</Button>
        <Button disabled variant="outlined">
          Disabled
        </Button>
      </Stack>

      <h2>Button sizes</h2>
      <Stack alignItems="center" direction="row" spacing={2}>
        <Grid>
          <Button size="small" variant="contained">
            small
          </Button>
        </Grid>
        <Grid>
          <Button size="medium" variant="contained">
            medium
          </Button>
        </Grid>
        <Grid>
          <Button size="large" variant="contained">
            large
          </Button>
        </Grid>
      </Stack>

      <Stack
        alignItems="center"
        direction="row"
        spacing={2}
        sx={{ margin: '12px 0' }}
      >
        <Button fullWidth variant="contained">
          Full width
        </Button>
      </Stack>

      <h2>Loader</h2>
      <Stack
        alignItems="center"
        direction="row"
        spacing={8}
        sx={{ marginBottom: '30px' }}
      >
        <Loader size={50} />
        <Loader size={70} thickness={5.0} />
        <Loader size={90} />
      </Stack>

      <h2>Breadcrumb</h2>
      <Box>
        {/*//Temporary function passed in prop*/}
        <Breadcrumbs onClick={closeModal} />
      </Box>

      {/* ConversionIcon,
  FileIcon,
  HandsIcon,
  HumanLogoIcon,
  RefreshIcon,
  ShadowFileIcon,
  ShadowHumanLogo,
  ShadowUserIcon,
  UserIcon,
  WhiteUserIcon,
  EllipseFile,
  EllipseUser,
  EllipseHumanLogo, */}

      <h2>Icons</h2>
      <Stack alignItems="center" direction="row" spacing={4}>
        <Grid>
          <ConversionIcon />
        </Grid>
        <Grid>
          <ConversionPurpleIcon />
        </Grid>
        <Grid>
          <FileIcon />
        </Grid>
        <Grid>
          <HandsIcon />
        </Grid>
        <Grid>
          <HumanLogoIcon />
        </Grid>
        <Grid>
          <RefreshIcon />
        </Grid>
        <Grid>
          <ShadowFileIcon />
        </Grid>
        <Grid>
          <ShadowHumanLogoIcon />
        </Grid>
        <Grid>
          <ShadowUserIcon />
        </Grid>
        <Grid>
          <UserIcon />
        </Grid>
        <Grid>
          <WhiteUserIcon />
        </Grid>
      </Stack>
      <Stack alignItems="center" direction="row" spacing={4}>
        <Grid>
          <EllipseFileIcon />
        </Grid>
        <Grid>
          <EllipseUserIcon />
        </Grid>
        <Grid>
          <EllipseHumanLogoIcon />
        </Grid>
        <Grid>
          <ShadowHandIcon />
        </Grid>
        <Grid>
          <InfoIcon />
        </Grid>
        <Grid>
          <ProfileIcon />
        </Grid>
        <Grid>
          <BackArrowMobileIcon />
        </Grid>
        <Grid>
          <BackArrowDesktopIcon />
        </Grid>
      </Stack>

      <h2>Modal</h2>

      <Button
        onClick={() => {
          openModal(MODAL_STATE.EXAMPLE_MODAL);
        }}
        title="Open Modal"
      />
      <Modal isOpen={isModalOpen}>
        <Stack alignContent="center" alignItems="center">
          <Typography variant="subtitle1">Title</Typography>
          <Typography sx={{ marginY: 2 }} variant="subtitle2">
            Subtitle
          </Typography>
          <Loader size={100} sx={{ marginY: '60px' }} />
        </Stack>
      </Modal>
    </div>
  );
}
