import { FormControl, InputLabel, Input, InputAdornment } from '@mui/material';
import { SearchIcon } from '../Icons/SearchIcon';

export const SearchField = () => {
  return (
    <FormControl variant="standard">
      <InputLabel htmlFor="standard-adornment-amount">Search</InputLabel>
      <Input
        autoFocus
        placeholder="Search by Jobs"
        startAdornment={
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        }
      />
    </FormControl>
  );
};
