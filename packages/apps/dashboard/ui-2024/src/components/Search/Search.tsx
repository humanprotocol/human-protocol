import { FC, useState }  from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

const Search: FC<{ className?: string, displaySearchBar?: boolean }> = ({ className, displaySearchBar }) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [focus, setFocus] = useState<boolean>(false);
  const [hover, setHover] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleMouseEnter = () => setHover(true);
  const handleMouseLeave = () => setHover(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleClearClick = () => {
    setInputValue('');
  };

  const handleInputBlur = () => {
    setFocus(false);
  };

  const handleInputFocus = () => {
    setFocus(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(`/search/${inputValue}`);
  };

  return (
  <form className={clsx('search', className, { 'search-white': displaySearchBar })} onSubmit={handleSubmit}>
    <input
      id='search-bar'
      placeholder='Search by Wallet/Escrow'
      value={inputValue}
      onChange={handleInputChange}
      onBlur={handleInputBlur}
      onFocus={handleInputFocus}
      className={clsx(hover && 'search-hover')}
    />
    {inputValue && (
      <CloseIcon
        onClick={handleClearClick}
        className='search-close'
        color={`${focus ? 'textSecondary' : 'primary'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    )}
    <IconButton
      className='search-button'
      type='submit'
      aria-label='search'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SearchIcon color={`${displaySearchBar ? 'textSecondary' : 'white'}`} />
    </IconButton>
  </form>
  );
};

export default Search;