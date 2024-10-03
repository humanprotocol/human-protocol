import HomepageLogoIconLight from '@/assets/icons/icons-homepage/logo.svg';
import HomepageLogoIconDark from '@/assets/icons-dark-mode/icons-homepage/logo.svg';
import HomepageUserIconLight from '@/assets/icons/icons-homepage/user.svg';
import HomepageUserIconDark from '@/assets/icons-dark-mode/icons-homepage/user.svg';
import HomepageWorkIconLight from '@/assets/icons/icons-homepage/work.svg';
import HomepageWorkIconDark from '@/assets/icons-dark-mode/icons-homepage/work.svg';
import HumanLogoIconLight from '@/assets/icons/icons-human-logo/human-logo.svg';
import HumanLogoIconDark from '@/assets/icons-dark-mode/icons-human-logo/human-logo.svg';
import ChatIcon from '@/assets/icons/chat.svg';
import HandIconLight from '@/assets/icons/hand.svg';
import HandIconDark from '@/assets/icons-dark-mode/hand.svg';
import RefreshIconLight from '@/assets/icons/refresh.svg';
import RefreshIconDark from '@/assets/icons-dark-mode/refresh.svg';
import UserOutlinedIconLight from '@/assets/icons/user-outlined.svg';
import UserOutlinedIconDark from '@/assets/icons-dark-mode/user-outlined.svg';
import WorkIconLight from '@/assets/icons/work.svg';
import WorkIconDark from '@/assets/icons-dark-mode/work.svg';
import HumanLogoNavbarIconLight from '@/assets/icons/icons-navbar/human-logo-navbar.svg';
import HumanLogoNavbarIconDark from '@/assets/icons-dark-mode/icons-navbar/human-logo-navbar.svg';
import HelpIconLight from '@/assets/icons/help.svg';
import HelpIconDark from '@/assets/icons-dark-mode/help.svg';
import ProfileIconLight from '@/assets/icons/profile-icon.svg';
import ProfileIconDark from '@/assets/icons-dark-mode/profile-icon.svg';
import CheckmarkIcon from '@/assets/icons/checkmark-icon.svg';
import LockerIconLight from '@/assets/icons/locker-icon.svg';
import LockerIconDark from '@/assets/icons-dark-mode/locker-icon.svg';
import FiltersButtonIconLight from '@/assets/icons/filters-button-icon.svg';
import FiltersButtonIconDark from '@/assets/icons-dark-mode/filters-button-icon.svg';
import SortArrowLight from '@/assets/icons/sort-arrow.svg';
import SortArrowDark from '@/assets/icons-dark-mode/sort-arrow.svg';
import FiltersIconLight from '@/assets/icons/filters-icon.svg';
import FiltersIconDark from '@/assets/icons-dark-mode/filters-icon.svg';
import MobileHomeIconsLight from '@/assets/icons/icons-homepage/mobile-home-icons.svg';
import MobileHomeIconsDark from '@/assets/icons-dark-mode/icons-homepage/mobile-home-icons.svg';
import SunIconDark from '@/assets/icons-dark-mode/sun.svg';
import SunIconLight from '@/assets/icons/sun.svg';
import MoonIconDark from '@/assets/icons-dark-mode/moon.svg';
import MoonIconLight from '@/assets/icons/moon.svg';
import { useColorMode } from '@/hooks/use-color-mode';

function HomepageLogoIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <HomepageLogoIconDark /> : <HomepageLogoIconLight />;
}
function HomepageUserIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <HomepageUserIconDark /> : <HomepageUserIconLight />;
}
function HomepageWorkIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <HomepageWorkIconDark /> : <HomepageWorkIconLight />;
}
function MobileHomeIcons() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <MobileHomeIconsDark /> : <MobileHomeIconsLight />;
}
function HumanLogoIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <HumanLogoIconDark /> : <HumanLogoIconLight />;
}
function HumanLogoNavbarIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? (
    <HumanLogoNavbarIconDark />
  ) : (
    <HumanLogoNavbarIconLight />
  );
}
function HandIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <HandIconDark /> : <HandIconLight />;
}
function RefreshIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <RefreshIconDark /> : <RefreshIconLight />;
}
function UserOutlinedIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <UserOutlinedIconDark /> : <UserOutlinedIconLight />;
}
function WorkIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <WorkIconDark /> : <WorkIconLight />;
}
function HelpIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <HelpIconDark /> : <HelpIconLight />;
}
function ProfileIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <ProfileIconDark /> : <ProfileIconLight />;
}
function LockerIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <LockerIconDark /> : <LockerIconLight />;
}
function FiltersButtonIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <FiltersButtonIconDark /> : <FiltersButtonIconLight />;
}
function SortArrow() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <SortArrowDark /> : <SortArrowLight />;
}
function FiltersIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <FiltersIconDark /> : <FiltersIconLight />;
}
function SunIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <SunIconDark /> : <SunIconLight />;
}
function MoonIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <MoonIconDark /> : <MoonIconLight />;
}

export {
  HomepageLogoIcon,
  HomepageUserIcon,
  HomepageWorkIcon,
  MobileHomeIcons,
  HumanLogoIcon,
  HumanLogoNavbarIcon,
  ChatIcon,
  HandIcon,
  RefreshIcon,
  UserOutlinedIcon,
  WorkIcon,
  HelpIcon,
  ProfileIcon,
  CheckmarkIcon,
  LockerIcon,
  FiltersButtonIcon,
  SortArrow,
  FiltersIcon,
  SunIcon,
  MoonIcon,
};
