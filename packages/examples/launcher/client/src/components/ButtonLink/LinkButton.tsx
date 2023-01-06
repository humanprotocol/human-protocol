import * as React from 'react';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material';

interface ILinkButton {
  url: string;
  title: string;
  disabled?: boolean;
}

export const StyledButton = styled(Button)`
  text-decoration: none;
  color: #3683dc;
  border: 1px solid #3683dc;
  width: 100%
  &:hover {
    text-decoration: node;
    color: #5ea1b6;
  }
`;

export const LinkButton = ({ url, title, disabled }: ILinkButton) => {
  return (
    <Button
      disabled={disabled}
      component={Link}
      to={`/${url}`}
      variant="contained"
      sx={{
        backgroundColor: '#fff',
        color: '#6309ff',
        '&:hover': {
          backgroundColor: '#fff',
          color: '#6309ff',
          boxShadow: '4px 4px rgb(0 0 0 / 15%)',
        },
      }}
    >
      {title}
    </Button>
  );
};
