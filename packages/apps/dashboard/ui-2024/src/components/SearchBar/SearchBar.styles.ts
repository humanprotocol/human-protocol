import { colorPalette } from '@assets/styles/color-palette';

export const endAdornmentInputAdornmentSx = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '0.7rem',
};

export const startAdornmentInputAdornmentSx = {
  height: '100%',
  backgroundColor: `${colorPalette.white}`,
  marginLeft: '1rem',
};

export const gridSx = {
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  gap: '8px',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
};

export const muiSelectSx = (
  isTopBar: boolean,
  mobile: { isMobile: boolean; mediaQuery: string }
) => ({
  backgroundColor: `${colorPalette.white}`,
  width: isTopBar ? '220px' : 'unset',
  fontSize: '16px',
  boxShadow: 'none',
  outline: 'none',
  '& .MuiOutlinedInput-notchedOutline': {
    border: 0,
    outline: 'none',
  },
  '& .MuiSelect-select': {
    padding: 0,
    paddingRight: '24px',
    backgroundColor: `${colorPalette.white}`,
    border: 0,
  },
  [mobile.mediaQuery]: {
    width: 'unset',
  },
});

export const menuItemSx = (isSelected: boolean) => ({
  display: 'flex',
  gap: '10px',
  backgroundColor: isSelected ? 'rgba(50, 10, 141, 0.08)' : 'inherit',
});

export const muiTextFieldInputPropsSx = (borderColor: string) => ({
  width: '100%',
  height: '100%',
  borderRadius: '10px',
  border: `1px solid ${borderColor}`,
  backgroundColor: `${colorPalette.white}`,
  fontSize: 'inherit',
  'input::placeholder': {
    color: `${colorPalette.sky.main}`,
    opacity: 1,
  },
  padding: '0 5px',
});

export const muiTextFieldSx = (mobile: {
  isMobile: boolean;
  mediaQuery: string;
}) => ({
  fontSize: '16px',
  '& .MuiOutlinedInput-root': {
    '& input': {
      [mobile.mediaQuery]: {
        padding: '12px 0px',
      },
    },
    '& fieldset': {
      border: 'none',
    },
  },
  '& .MuiInputBase-input': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});
