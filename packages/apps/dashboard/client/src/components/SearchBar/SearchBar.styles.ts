import { Theme } from '@mui/material/styles';

export const endAdornmentInputAdornmentSx = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '0.7rem',
};

export const startAdornmentInputAdornmentSx = (theme: Theme) => ({
  height: '100%',
  backgroundColor: theme.palette.white.contrastText,
  marginLeft: '1rem',
});

export const gridSx = {
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  gap: '8px',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
};

export const muiSelectSx = (theme: Theme) => ({
  backgroundColor: theme.palette.white.contrastText,
  width: 'unset',
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
    backgroundColor: theme.palette.white.contrastText,
    border: 0,
  },
});

export const menuItemSx = (isSelected: boolean) => ({
  display: 'flex',
  gap: '10px',
  backgroundColor: isSelected ? 'rgba(50, 10, 141, 0.08)' : 'inherit',
});

export const muiTextFieldInputPropsSx = (
  theme: Theme,
  borderColor: string
) => ({
  width: '100%',
  height: '100%',
  borderRadius: '10px',
  border: `1px solid ${borderColor}`,
  backgroundColor: theme.palette.white.contrastText,
  fontSize: 'inherit',
  'input::placeholder': {
    color: theme.palette.sky.main,
    opacity: 1,
  },
  padding: '0 5px',
});

export const muiTextFieldSx = (isMobile: boolean) => ({
  fontSize: '16px',
  '& .MuiOutlinedInput-root': {
    '& input': {
      padding: isMobile ? '12px 0px' : '16px 0px',
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
