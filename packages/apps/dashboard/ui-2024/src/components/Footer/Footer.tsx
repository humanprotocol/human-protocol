import { FC } from 'react';
import Typography from '@mui/material/Typography';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import TelegramIcon from '@mui/icons-material/Telegram';
import DiscordIcon from '@components/Icons/DiscordIcon';
import { colorPalette } from '@assets/styles/color-palette';

const Footer: FC = () => {
	const handleClick = (url: string) => {
		window.open(url, '_blank');
	};

	return (
		<footer>
			<div className="footer-wrapper">
				<div className="footer-link-wrapper">
					<div className="footer-link">
						<Typography
							component="span"
							color="text.secondary"
							onClick={() => handleClick('https://app.humanprotocol.org/')}
						>
							Privacy Policy
						</Typography>
						<Typography
							component="span"
							color="text.secondary"
							onClick={() => handleClick('https://app.humanprotocol.org/')}
						>
							Terms of Service
						</Typography>
						<Typography
							component="span"
							color="text.secondary"
							onClick={() => handleClick('https://app.humanprotocol.org/')}
						>
							HUMAN Protocol
						</Typography>
					</div>
					<Typography variant="subtitle1" color="text.secondary">
						© 2021 HPF. HUMAN Protocol® is a registered trademark
					</Typography>
				</div>
				<div className="footer-icon">
					<GitHubIcon
						style={{
							color: colorPalette.sky.main,
						}}
						onClick={() => handleClick('https://app.humanprotocol.org/')}
					/>
					<DiscordIcon
						style={{
							color: colorPalette.sky.main,
						}}
						onClick={() => handleClick('https://app.humanprotocol.org/')}
					/>
					<TwitterIcon
						style={{
							color: colorPalette.sky.main,
						}}
						onClick={() => handleClick('https://app.humanprotocol.org/')}
					/>
					<TelegramIcon
						style={{
							color: colorPalette.sky.main,
						}}
						onClick={() => handleClick('https://app.humanprotocol.org/')}
					/>
					<LinkedInIcon
						style={{
							color: colorPalette.sky.main,
						}}
						onClick={() => handleClick('https://app.humanprotocol.org/')}
					/>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
