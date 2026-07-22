import { SvgIcon, SvgIconProps } from '@mui/material';

import HumanLogoIconLight from '@/assets/icons/icons-human-logo/human-logo.svg';
import HumanLogoIconDark from '@/assets/icons-dark-mode/icons-human-logo/human-logo.svg';
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
import SunIconDark from '@/assets/icons-dark-mode/sun.svg';
import SunIconLight from '@/assets/icons/sun.svg';
import MoonIconDark from '@/assets/icons-dark-mode/moon.svg';
import MoonIconLight from '@/assets/icons/moon.svg';
import { useColorMode } from '@/shared/contexts/color-mode';
import WorkHeaderDark from '@/assets/icons-dark-mode/work-header.svg';
import WorkHeaderLight from '@/assets/icons/work-header.svg';
import CopyIconLight from '@/assets/icons/content-copy.svg';
import CopyIconDark from '@/assets/icons-dark-mode/content-copy.svg';
import EditIconLight from '@/assets/icons/edit-icon.svg';
import EditIconDark from '@/assets/icons-dark-mode/edit-icon.svg';
import DeleteIconLight from '@/assets/icons/delete-icon.svg';
import DeleteIconDark from '@/assets/icons-dark-mode/delete-icon.svg';
import VeriffIconLight from '@/assets/icons/veriff.svg';
import VeriffIconDark from '@/assets/icons-dark-mode/veriff.svg';
import HourglassIconLight from '@/assets/icons/hourglass.svg';
import HourglassIconDark from '@/assets/icons-dark-mode/hourglass.svg';

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
function WorkHeaderIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <WorkHeaderDark /> : <WorkHeaderLight />;
}
function HandIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <HandIconDark /> : <HandIconLight />;
}
function RefreshIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <RefreshIconDark /> : <RefreshIconLight />;
}
function InverseRefreshIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <RefreshIconLight /> : <RefreshIconDark />;
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
function CopyIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <CopyIconDark /> : <CopyIconLight />;
}
function EditIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <EditIconDark /> : <EditIconLight />;
}
function DeleteIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <DeleteIconDark /> : <DeleteIconLight />;
}
function InboxIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 54 54" fill="none">
      <path
        d="M17 31.5H4.5L5.5 43.5L11.5 49H39L45.5 45.5L47.5 31.5H36L30 37.5H22.5L17 31.5Z"
        fill="currentColor"
      />
      <path
        fill="none"
        d="M47.25 27V28.125C47.25 38.2013 47.25 43.2394 44.1197 46.3697C40.9894 49.5 35.9513 49.5 25.875 49.5C15.7987 49.5 10.7606 49.5 7.6303 46.3697C4.5 43.2394 4.5 38.2013 4.5 28.125C4.5 18.0487 4.5 13.0106 7.6303 9.8803C10.7606 6.75 15.7987 6.75 25.875 6.75H27"
        stroke="currentColor"
        strokeWidth="3.375"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M49.5 12.375C49.5 16.7242 45.9742 20.25 41.625 20.25C37.2758 20.25 33.75 16.7242 33.75 12.375C33.75 8.02576 37.2758 4.5 41.625 4.5C45.9742 4.5 49.5 8.02576 49.5 12.375Z"
        fill="#FA2A75"
      />
      <path
        fill="none"
        d="M47.25 31.5H36.1673C34.2725 31.5 32.7838 33.0831 31.9488 34.7563C31.0416 36.574 29.225 38.25 25.875 38.25C22.525 38.25 20.7084 36.574 19.8012 34.7563C18.9662 33.0831 17.4775 31.5 15.5827 31.5H4.5"
        stroke="currentColor"
        strokeWidth="3.375"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}

function SuccessIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 73 73" fill="none">
      <circle cx="36.5" cy="36.5" r="36.5" fill="#FA2A75" />
      <path
        fill="none"
        d="M67 36.5C67 19.9315 53.5685 6.5 37 6.5C20.4315 6.5 7 19.9315 7 36.5C7 53.0685 20.4315 66.5 37 66.5C53.5685 66.5 67 53.0685 67 36.5Z"
        stroke="white"
        strokeWidth="4.5"
      />
      <path
        fill="none"
        d="M25 38.75C25 38.75 29.8 41.4876 32.2 45.5C32.2 45.5 39.4 29.75 49 24.5"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}

function VeriffIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <VeriffIconDark /> : <VeriffIconLight />;
}

function HourglassIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <HourglassIconDark /> : <HourglassIconLight />;
}

export {
  HumanLogoIcon,
  HumanLogoNavbarIcon,
  HandIcon,
  RefreshIcon,
  InverseRefreshIcon,
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
  WorkHeaderIcon,
  CopyIcon,
  EditIcon,
  DeleteIcon,
  InboxIcon,
  SuccessIcon,
  VeriffIcon,
  HourglassIcon,
};
