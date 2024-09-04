import { FC, useState } from 'react';
import clsx from 'clsx';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import logo from '@assets/logo.png';
import Search from '@components/Search';
import logoMobile from '@assets/logo-mobile.png';
import { env } from '@helpers/env';
import { useNavigate } from 'react-router-dom';

const Header: FC<{ displaySearchBar?: boolean }> = ({ displaySearchBar }) => {
	const navigate = useNavigate();
	const [open, setState] = useState(false);

	const handleClick = (url: string) => {
		window.open(url, '_blank');
	};

	const toggleDrawer = (open: boolean) => {
		setState(open);
	};

	return (
		<Toolbar
			className={clsx('header-toolbar', {
				'header-toolbar-search': displaySearchBar,
			})}
		>
			{displaySearchBar && (
				<Search displaySearchBar className="search-header-mobile" />
			)}
			<Link
				onClick={() => {
					navigate('/');
				}}
				underline="none"
				sx={{
					':hover': {
						cursor: 'pointer',
					},
				}}
			>
				<img className="logo" src={logo} alt="logo" />
				<img className="logo-mobile" src={logoMobile} alt="logo" />
			</Link>

			{displaySearchBar && (
				<Search displaySearchBar className="search-header" />
			)}

			<div className="header-list-link">
				<div
					className="header-link"
					onClick={() => handleClick(env.VITE_NAVBAR_LINK_GITBOOK)}
				>
					GitBook
				</div>
				<div
					className="header-link"
					onClick={() => handleClick(env.VITE_NAVBAR_LINK_FAUCETS)}
				>
					Faucet
				</div>
				<div
					className="header-link"
					onClick={() => handleClick(env.VITE_NAVBAR_LINK_HUMAN_WEBSITE)}
				>
					HUMAN Website
				</div>
				<Button
					variant="contained"
					color="primary"
					onClick={() => handleClick(env.VITE_NAVBAR_LINK_LAUNCH_JOBS)}
				>
					Launch Jobs
				</Button>
				<Button
					variant="contained"
					color="secondary"
					onClick={() => handleClick(env.VITE_NAVBAR_LINK_WORK_AND_EARN)}
				>
					Work & Earn
				</Button>
			</div>

			<IconButton
				edge="start"
				color="inherit"
				aria-label="open drawer"
				className="mobile-icon"
				onClick={() => toggleDrawer(true)}
			>
				<MenuIcon />
			</IconButton>

			<Drawer
				anchor="right"
				variant="temporary"
				open={open}
				onClose={() => toggleDrawer(false)}
				PaperProps={{
					sx: {
						width: '80%',
					},
				}}
			>
				<Box className="header-mobile-menu">
					<div className="header-list-link">
						<div
							className="header-link"
							onClick={() => handleClick(env.VITE_NAVBAR_LINK_GITBOOK)}
						>
							GitBook
						</div>
						<div
							className="header-link"
							onClick={() => handleClick(env.VITE_NAVBAR_LINK_FAUCETS)}
						>
							Faucet
						</div>
						<div
							className="header-link"
							onClick={() => handleClick(env.VITE_NAVBAR_LINK_HUMAN_WEBSITE)}
						>
							HUMAN Website
						</div>
						<Button
							variant="contained"
							color="primary"
							onClick={() => handleClick(env.VITE_NAVBAR_LINK_LAUNCH_JOBS)}
						>
							Launch Jobs
						</Button>
						<Button
							variant="contained"
							color="secondary"
							onClick={() => handleClick(env.VITE_NAVBAR_LINK_WORK_AND_EARN)}
						>
							Work & Earn
						</Button>
					</div>
				</Box>
			</Drawer>
		</Toolbar>
	);
};

export default Header;
