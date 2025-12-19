import { colorPalette } from '@/shared/styles/color-palette';
import {
  darkColorPalette,
  onlyDarkModeColor,
} from '@/shared/styles/dark-color-palette';
import { styled, TextField } from '@mui/material';

const CustomTextField = styled(TextField)(() => ({
  '& .Mui-disabled': {
    height: '48px',
    maxWidth: '376px',
    color: colorPalette.text.disabledSecondary,
    WebkitTextFillColor: colorPalette.text.disabledSecondary,
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      border: '1px dashed',
      borderColor: `${colorPalette.text.primary} !important`,
      color: colorPalette.text.disabledSecondary,
      WebkitTextFillColor: colorPalette.text.disabledSecondary,
    },
  },
}));

const CustomTextFieldDark = styled(TextField)(() => ({
  '& .Mui-disabled': {
    height: '48px',
    maxWidth: '376px',
    color: darkColorPalette.text.disabledSecondary,
    WebkitTextFillColor: darkColorPalette.text.disabledSecondary,
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      border: '1px dashed',
      borderColor: `${onlyDarkModeColor.mainColorWithOpacity} !important`,
      color: darkColorPalette.text.disabledSecondary,
      WebkitTextFillColor: darkColorPalette.text.disabledSecondary,
    },
  },
}));

export { CustomTextField, CustomTextFieldDark };
