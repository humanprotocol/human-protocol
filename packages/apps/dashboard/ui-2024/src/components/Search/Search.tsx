import { FC, useEffect, useState } from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import {
	InputAdornment,
	TextField,
	MenuItem,
	Select as MuiSelect,
	SelectChangeEvent,
} from '@mui/material';
import { colorPalette } from '@assets/styles/color-palette';
import { getNetwork, networks } from '@utils/config/networks';
import { useWalletSearch } from '@utils/hooks/use-wallet-search';

const Search: FC<{ className?: string; displaySearchBar?: boolean }> = ({
	className,
	displaySearchBar,
}) => {
	const { filterParams, setAddress, setChainId } = useWalletSearch();
	const [inputValue, setInputValue] = useState<string>('');
	const [selectValue, setSelectValue] = useState<string>('');
	const [focus, setFocus] = useState<boolean>(false);
	const navigate = useNavigate();

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setAddress(event.target.value);
	};

	const handleSelectChange = (event: SelectChangeEvent<string>) => {
		const chainId = Number(event.target.value);
		setChainId(chainId);
		const networkName = getNetwork(chainId)?.name || '';
		setSelectValue(networkName);
	};

	const handleClearClick = () => {
		setInputValue('');
		setAddress('');
	};

	const handleInputBlur = () => {
		setFocus(false);
	};

	const handleInputFocus = () => {
		setFocus(true);
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		navigate(
			`/search/${filterParams.chainId || -1}/${filterParams.address || '0x0'}`
		);
	};

	useEffect(() => {
		const networkName = getNetwork(filterParams.chainId || -1)?.name || '';
		if (networkName) {
			setSelectValue(networkName);
		}
	}, [filterParams.chainId]);

	useEffect(() => {
		setInputValue(filterParams.address);
	}, [filterParams.address]);

	return (
		<form
			className={clsx('search', className, {
				'search-white': displaySearchBar,
			})}
			onSubmit={handleSubmit}
		>
			<TextField
				id="search-bar"
				placeholder="Search by Wallet/Escrow"
				value={filterParams.address}
				onChange={handleInputChange}
				onBlur={handleInputBlur}
				onFocus={handleInputFocus}
				fullWidth
				sx={{
					outline: 'none',
					border: 'none',
					fontSize: '16px',

					'& .MuiInputBase-inputAdornedStart': {
						root: {
							border: 'none',
						},
					},
					'& .MuiInputBase-input': {
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					},
				}}
				InputProps={{
					sx: {
						width: '100%',
						height: '100%',
						fontSize: 'inherit',
						border: 'none',
						'input::placeholder': {
							color: `${colorPalette.sky.main}`,
							opacity: 1,
						},
						padding: '0 5px',
					},
					startAdornment: (
						<InputAdornment
							position="start"
							sx={{
								root: {
									backgroundColor: 'red',
								},
								width: displaySearchBar ? '100px' : '220px',
								height: '100%',
								backgroundColor: `${colorPalette.white}`,
								marginLeft: '1rem',
							}}
						>
							<MuiSelect
								value={selectValue}
								displayEmpty
								sx={{
									backgroundColor: `${colorPalette.white}`,
									width: displaySearchBar ? '100px' : '220px',
									fontSize: '16px',
									boxShadow: 'none',
									'.MuiOutlinedInput-notchedOutline': { border: 0 },
									'& .MuiSelect-select': {
										padding: 0,
										paddingRight: '24px',
										backgroundColor: `${colorPalette.white}`,
										border: 0,
									},
									'& .MuiInputBase-input': {
										backgroundColor: `${colorPalette.white}`,
									},
									'&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
										{
											border: 0,
										},
									'&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
										{
											border: 0,
										},
								}}
								onChange={handleSelectChange}
								renderValue={
									selectValue === ''
										? () => (
												<span style={{ color: colorPalette.sky.main }}>
													Network
												</span>
											)
										: () => selectValue
								}
							>
								{networks.map((network) => (
									<MenuItem key={network.name} value={network.id}>
										{network.name}
									</MenuItem>
								))}
							</MuiSelect>
						</InputAdornment>
					),
					endAdornment: inputValue && (
						<InputAdornment
							sx={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								gap: '0.7rem',
							}}
							position="end"
						>
							<IconButton onClick={handleClearClick} edge="end">
								<CloseIcon color={`${focus ? 'textSecondary' : 'primary'}`} />
							</IconButton>
							<IconButton
								className="search-button"
								type="submit"
								aria-label="search"
							>
								<SearchIcon
									color={`${displaySearchBar ? 'textSecondary' : 'white'}`}
								/>
							</IconButton>
						</InputAdornment>
					),
				}}
			/>
		</form>
	);
};

export default Search;
