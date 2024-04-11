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
  HomepageLogoIcon,
  HomepageUserIcon,
  HomepageWorkIcon,
  HumanLogoIcon,
  HumanLogoCircleIcon,
  BackArrowIcon,
  ChatIcon,
  HandIcon,
  InfoIcon,
  RefreshIcon,
  UserFilledIcon,
  UserOutlinedIcon,
  UserSecondaryIcon,
  WorkIcon,
  WorkSecondaryIcon,
  HumanLogoNavbarIcon,
  DiscordIcon,
} from '@/components/ui/icons';
import { TableExample } from '@/pages/playground/table-example/table-example';

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
          H1 / Inter Extrabold 80
        </Typography>

        <Typography component="p" variant="h2">
          H2 / Inter Semibold 60
        </Typography>

        <Typography component="p" variant="h3">
          H3 / Inter Regular 48
        </Typography>

        <Typography component="p" variant="h4">
          H4 / Inter Semibold 34
        </Typography>

        <Typography component="p" variant="h5">
          H5 / Inter Regular 24
        </Typography>

        <Typography component="p" variant="h6">
          H6 / Inter Medium 20
        </Typography>

        <Typography variant="subtitle1">
          Subtitle 1 / Inter Regular 16
        </Typography>

        <Typography variant="subtitle2">
          Subtitle 2 / Inter Semibold 14
        </Typography>

        <Typography variant="body1">Body 1 / Inter Regular 16</Typography>

        <Typography variant="body2">Body 1 / Inter Regular 14</Typography>

        <Typography variant="body3">Body 3 / Inter Medium 16</Typography>

        <Typography variant="buttonLarge">
          Button large / Inter Semibold 15
        </Typography>

        <Typography variant="buttonMedium">
          Button medium / Inter Semibold 14
        </Typography>

        <Typography variant="buttonSmall">
          Button small / Inter Semibold 13
        </Typography>

        <Typography variant="caption">Caption / Inter Regular 12</Typography>
        <Typography variant="overline">Overline / Inter Regular 12</Typography>
        <Typography variant="avatarLetter">
          Avatar Letter / Inter Regular 20
        </Typography>
        <Typography variant="inputLabel">
          Input Label / Inter Regular 12
        </Typography>
        <Typography variant="helperText">
          Helper Text / Inter Regular 12
        </Typography>
        <Typography variant="inputText">
          Input Text / Inter Regular 16
        </Typography>
        <Typography variant="tooltip">Tooltip / Inter Medium 12</Typography>
        <Typography variant="inputUnderline">
          Input Under line / Inter Semibold 12
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

      <h2>Icons</h2>
      <Stack alignItems="center" direction="row" spacing={4}>
        <Grid>
          <HomepageLogoIcon />
        </Grid>
        <Grid>
          <HomepageUserIcon />
        </Grid>
        <Grid>
          <HomepageWorkIcon />
        </Grid>
        <Grid>
          <HumanLogoIcon />
        </Grid>
        <Grid>
          <HumanLogoCircleIcon />
        </Grid>
        <Grid>
          <HandIcon />
        </Grid>
        <Grid>
          <RefreshIcon />
        </Grid>
      </Stack>
      <Stack alignItems="center" direction="row" spacing={4}>
        <Grid>
          <UserFilledIcon />
        </Grid>
        <Grid>
          <UserOutlinedIcon />
        </Grid>
        <Grid>
          <UserSecondaryIcon />
        </Grid>
        <Grid>
          <WorkIcon />
        </Grid>
        <Grid>
          <WorkSecondaryIcon />
        </Grid>
        <Grid>
          <BackArrowIcon />
        </Grid>
        <Grid>
          <ChatIcon />
        </Grid>
        <Grid>
          <InfoIcon />
        </Grid>
        <Grid>
          <HumanLogoNavbarIcon />
        </Grid>
        <Grid>
          <DiscordIcon />
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

      <h2>Table</h2>
      <TableExample />
    </div>
  );
}
