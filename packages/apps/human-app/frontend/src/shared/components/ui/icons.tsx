import { SvgIcon, SvgIconProps } from '@mui/material';

import HumanLogoIconLight from '@/assets/icons/icons-human-logo/human-logo.svg';
import HumanLogoIconDark from '@/assets/icons-dark-mode/icons-human-logo/human-logo.svg';
import RefreshIconLight from '@/assets/icons/refresh.svg';
import RefreshIconDark from '@/assets/icons-dark-mode/refresh.svg';
import HumanLogoNavbarIconLight from '@/assets/icons/icons-navbar/human-logo-navbar.svg';
import HumanLogoNavbarIconDark from '@/assets/icons-dark-mode/icons-navbar/human-logo-navbar.svg';
import HelpIconLight from '@/assets/icons/help.svg';
import HelpIconDark from '@/assets/icons-dark-mode/help.svg';
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
import EditIconLight from '@/assets/icons/edit-icon.svg';
import EditIconDark from '@/assets/icons-dark-mode/edit-icon.svg';
import DeleteIconLight from '@/assets/icons/delete-icon.svg';
import DeleteIconDark from '@/assets/icons-dark-mode/delete-icon.svg';
import VeriffIconLight from '@/assets/icons/veriff.svg';
import VeriffIconDark from '@/assets/icons-dark-mode/veriff.svg';
import HourglassIconLight from '@/assets/icons/hourglass.svg';
import HourglassIconDark from '@/assets/icons-dark-mode/hourglass.svg';
import LogoutIcon from '@/assets/icons/logout.svg';
import TriangleIcon from '@/assets/icons/triangle.svg';
import HcaptchaIconAsset from '@/assets/icons/hcaptcha.svg';
import HcaptchaDisabledIconLight from '@/assets/icons/hcaptcha-disabled-icon.svg';
import HcaptchaDisabledIconDark from '@/assets/icons-dark-mode/hcaptcha-disabled-icon.svg';

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
function RefreshIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <RefreshIconDark /> : <RefreshIconLight />;
}
function HelpIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <HelpIconDark /> : <HelpIconLight />;
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
function EditIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <EditIconDark /> : <EditIconLight />;
}
function DeleteIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <DeleteIconDark /> : <DeleteIconLight />;
}
function VeriffIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <VeriffIconDark /> : <VeriffIconLight />;
}
function HourglassIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? <HourglassIconDark /> : <HourglassIconLight />;
}
function HcaptchaIcon() {
  return <HcaptchaIconAsset />;
}
function HcaptchaDisabledIcon() {
  const { isDarkMode } = useColorMode();
  return isDarkMode ? (
    <HcaptchaDisabledIconDark />
  ) : (
    <HcaptchaDisabledIconLight />
  );
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

function CopyIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 16 16" fill="none">
      <g opacity="0.7" clipPath="url(#clip0_281_2824)">
        <path
          fill="none"
          d="M6 10C6 8.11438 6 7.17157 6.58579 6.58579C7.17157 6 8.11438 6 10 6L10.6667 6C12.5523 6 13.4951 6 14.0809 6.58579C14.6667 7.17157 14.6667 8.11438 14.6667 10V10.6667C14.6667 12.5523 14.6667 13.4951 14.0809 14.0809C13.4951 14.6667 12.5523 14.6667 10.6667 14.6667H10C8.11438 14.6667 7.17157 14.6667 6.58579 14.0809C6 13.4951 6 12.5523 6 10.6667L6 10Z"
          stroke="currentColor"
          strokeOpacity="0.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          fill="none"
          d="M11.3339 6.00016C11.3323 4.02877 11.3025 3.00764 10.7287 2.30845C10.6179 2.17342 10.4941 2.04961 10.359 1.9388C9.62147 1.3335 8.52564 1.3335 6.33399 1.3335C4.14233 1.3335 3.0465 1.3335 2.30894 1.9388C2.17391 2.04961 2.0501 2.17342 1.93929 2.30845C1.33398 3.04601 1.33398 4.14184 1.33398 6.3335C1.33398 8.52515 1.33398 9.62098 1.93929 10.3585C2.0501 10.4936 2.17391 10.6174 2.30894 10.7282C3.00812 11.302 4.02926 11.3319 6.00065 11.3334"
          stroke="currentColor"
          strokeOpacity="0.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_281_2824">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </SvgIcon>
  );
}

function OracleAddressIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 20 20" fill="none">
      <path
        fill="none"
        d="M9.9987 14.1666C10.1877 14.1666 10.3635 14.0782 10.715 13.9016L13.5401 12.4816C14.7903 11.8533 15.4154 11.5391 15.4154 11.0416V4.79156M9.9987 14.1666C9.80965 14.1666 9.63391 14.0782 9.28243 13.9016L6.45725 12.4816C5.20711 11.8533 4.58203 11.5391 4.58203 11.0416V4.79156M9.9987 14.1666V7.91656M15.4154 4.79156C15.4154 4.29404 14.7903 3.97987 13.5401 3.35153L10.715 1.93156C10.3635 1.7549 10.1877 1.66656 9.9987 1.66656C9.80965 1.66656 9.63391 1.7549 9.28243 1.93156L6.45725 3.35153C5.20711 3.97987 4.58203 4.29404 4.58203 4.79156M4.58203 4.79156C4.58203 5.28908 5.20711 5.60326 6.45725 6.2316L9.28243 7.65157C9.63391 7.82823 9.80965 7.91656 9.9987 7.91656C10.1877 7.91656 10.3635 7.82823 10.715 7.65157L13.5401 6.2316C14.7903 5.60326 15.4154 5.28908 15.4154 4.79156"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M8.33268 17.2916C8.33268 16.7163 8.79905 16.2499 9.37435 16.2499H10.6243C11.1996 16.2499 11.666 16.7163 11.666 17.2916M8.33268 17.2916C8.33268 17.8669 8.79905 18.3333 9.37435 18.3333H10.6243C11.1996 18.3333 11.666 17.8669 11.666 17.2916M8.33268 17.2916H4.16602M11.666 17.2916H15.8327"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </SvgIcon>
  );
}

function OracleRewardIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 20 20" fill="none">
      <path
        fill="none"
        d="M4.81787 3.48494C5.35774 3.06933 5.62768 2.86152 5.93925 2.72769C6.08052 2.66701 6.22741 2.61798 6.37817 2.58117C6.71069 2.5 7.06327 2.5 7.76843 2.5H12.2303C12.9354 2.5 13.288 2.5 13.6205 2.58117C13.7713 2.61798 13.9182 2.66701 14.0594 2.72769C14.371 2.86152 14.641 3.06933 15.1808 3.48494C16.9697 4.86207 17.8641 5.55064 18.1708 6.44232C18.3071 6.83894 18.3581 7.25607 18.3208 7.67051C18.237 8.60223 17.5309 9.45496 16.1188 11.1604L12.7909 15.1794C11.5098 16.7265 10.8693 17.5 9.99935 17.5C9.12938 17.5 8.48887 16.7265 7.20783 15.1794L3.87994 11.1604C2.46775 9.45496 1.76165 8.60223 1.67785 7.67051C1.64058 7.25607 1.69155 6.83894 1.82793 6.44232C2.13455 5.55064 3.02899 4.86207 4.81787 3.48494Z"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        fill="none"
        d="M8.33203 7.08337H11.6654"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}

function MenuIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 20 20" fill="none">
      <path
        fill="none"
        d="M5 5.83331L15 5.83331"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fill="none"
        d="M5 9.99994L15 9.99994"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fill="none"
        d="M5 14.1666L15 14.1666"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}

export {
  HumanLogoIcon,
  HumanLogoNavbarIcon,
  RefreshIcon,
  HelpIcon,
  CheckmarkIcon,
  LockerIcon,
  FiltersButtonIcon,
  SortArrow,
  FiltersIcon,
  SunIcon,
  MoonIcon,
  CopyIcon,
  EditIcon,
  DeleteIcon,
  InboxIcon,
  SuccessIcon,
  VeriffIcon,
  HourglassIcon,
  LogoutIcon,
  TriangleIcon,
  OracleAddressIcon,
  OracleRewardIcon,
  MenuIcon,
  HcaptchaIcon,
  HcaptchaDisabledIcon,
};
