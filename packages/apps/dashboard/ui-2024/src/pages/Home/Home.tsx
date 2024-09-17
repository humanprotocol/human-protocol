import PageWrapper from '@components/PageWrapper';
import Search from '@components/Search';
import ShadowIcon from '@components/ShadowIcon';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Divider from '@mui/material/Divider';
import { Link } from 'react-router-dom';
import { Leaderboard } from './Leaderboard';
import GraphSwiper from '@components/Home/GraphSwiper';
import { HMTPrice } from '@pages/Home/HMTPrice';
import { TotalNumberOfTasks } from '@pages/Home/TotalNumberOfTasks';
import { Holders } from '@pages/Home/Holders';
import { TotalTransactions } from '@pages/Home/TotalTransactions';
import { LeaderboardIcon } from '@components/Icons/LeaderboardIcon';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';
import { colorPalette } from '@assets/styles/color-palette';

const Home: React.FC = () => {
	const {
		mobile: { isMobile },
	} = useBreakPoints();
	return (
		<PageWrapper violetHeader>
			<div className="home-page-header">
				<Typography
					fontWeight={isMobile ? undefined : 600}
					variant={isMobile ? 'H6-Mobile' : 'h3'}
				>
					All HUMAN activity. In one place.
				</Typography>
				<Search className="home-page-search" />
			</div>
			<div className="home-page-boxes">
				<div className="home-page-box">
					<div className="box-title">Token</div>
					<div className="box-content">
						<div className="box-icon">
							<Tooltip title="Token Current Price" arrow>
								<HelpOutlineIcon
									style={{
										color: colorPalette.sky.main,
									}}
								/>
							</Tooltip>
						</div>
						<HMTPrice />
					</div>
					<Divider
						sx={{
							marginY: 3,
						}}
					/>
					<div className="box-content">
						<div className="box-icon">
							<Tooltip title="Number of users holding HMT" arrow>
								<HelpOutlineIcon
									style={{
										color: colorPalette.sky.main,
									}}
								/>
							</Tooltip>
						</div>
						<Holders />
					</div>
				</div>
				<div className="home-page-box">
					<div className="box-title">
						Data Overview
						<Button
							sx={{ padding: '4px 10px' }}
							variant="outlined"
							color="secondary"
							component={Link}
							to="/graph"
						>
							View Charts
						</Button>
					</div>
					<div className="box-content">
						<div className="box-icon">
							<Tooltip title="Total number of transactions" arrow>
								<HelpOutlineIcon
									style={{
										color: colorPalette.sky.main,
									}}
								/>
							</Tooltip>
						</div>
						<TotalTransactions />
					</div>
					<Divider
						sx={{
							marginY: 3,
						}}
					/>
					<div className="box-content">
						<div className="box-icon">
							<Tooltip title="Number of tasks that have been launched" arrow>
								<HelpOutlineIcon
									style={{
										color: colorPalette.sky.main,
									}}
								/>
							</Tooltip>
						</div>
						<TotalNumberOfTasks />
					</div>
				</div>
				<div className="home-page-box">
					<GraphSwiper />
				</div>
			</div>
			<ShadowIcon
				className="home-page-leaderboard"
				title="Leaderboard"
				img={<LeaderboardIcon />}
			/>
			<Leaderboard />
		</PageWrapper>
	);
};

export default Home;
