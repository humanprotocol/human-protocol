import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { colorPalette } from '@/styles/color-palette';
import { MODAL_STATE, useModalStore } from '@/components/ui/modal/modal.store';
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
  HelpIcon,
  MobileHeaderIcon,
  ProfileIcon,
  CheckmarkIcon,
  LockerIcon,
  FiltersButtonIcon,
  SortArrow,
} from '@/components/ui/icons';
import { TableExample } from '@/pages/playground/table-example/table-example';
import { Alert } from '@/components/ui/alert';
import { ConnectWalletBtn } from '@/components/ui/connect-wallet-btn';

export function UiExample() {
  const { openModal } = useModalStore();
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
      <Stack direction="row" flexWrap="wrap" spacing={2}>
        <Button variant="text">Text</Button>
        <Button variant="contained">Contained</Button>
        <Button variant="outlined">Outlined</Button>
        <Button disabled variant="outlined">
          Disabled
        </Button>
        <Button loading variant="outlined">
          Loading
        </Button>
      </Stack>

      <h2>Button sizes</h2>
      <Stack alignItems="center" direction="row" flexWrap="wrap" spacing={2}>
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

      <h2>Connect wallet button</h2>
      <ConnectWalletBtn />

      <h2>Loader</h2>
      <Stack
        alignItems="center"
        direction="row"
        flexWrap="wrap"
        spacing={8}
        sx={{ marginBottom: '30px' }}
      >
        <Loader size={50} />
        <Loader size={70} thickness={5.0} />
        <Loader size={90} />
      </Stack>

      <h2>Icons</h2>
      <Stack alignItems="center" direction="row" flexWrap="wrap" spacing={4}>
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
        <Grid>
          <HelpIcon />
        </Grid>
      </Stack>
      <Stack alignItems="center" direction="row" spacing={4}>
        <Grid>
          <MobileHeaderIcon />
        </Grid>
        <Grid>
          <ProfileIcon />
        </Grid>
        <Grid>
          <CheckmarkIcon />
        </Grid>
        <Grid>
          <LockerIcon />
        </Grid>
        <Grid>
          <FiltersButtonIcon />
        </Grid>
        <Grid>
          <SortArrow />
        </Grid>
      </Stack>

      <h2>Modal</h2>

      <Button
        onClick={() => {
          openModal(MODAL_STATE.MODAL_EXAMPLE);
        }}
      >
        Open modal
      </Button>

      <h2>Table</h2>
      <TableExample />

      <h2>Alert</h2>
      <Stack direction="column" spacing={4}>
        <Alert color="error" severity="error">
          An error has occurred, please try again.
        </Alert>
        <Alert color="success" severity="success">
          Your password has been successfully updated!
        </Alert>
        <Alert color="warning" severity="warning">
          We have switched to the Polygon network. You’ll need to replace your
          Ethereum wallet address with one connected to Polygon.
        </Alert>
      </Stack>
    </div>
  );
}
