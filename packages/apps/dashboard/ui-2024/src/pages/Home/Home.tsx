import PageWrapper from '@components/PageWrapper';
import Search from '@components/Search';
import ShadowIcon from '@components/ShadowIcon';
import { HMTPrice } from './HMTPrice';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Divider from '@mui/material/Divider';

import SimpleBar from 'simplebar-react';
import { Link } from 'react-router-dom';

import bitfinex from '@assets/bitfinex.png';
import probitGlobal from '@assets/probitGlobal.png';
import gate from '@assets/gate.png';
import bing from '@assets/bing.png';
import coinlist from '@assets/coinlist.png';
import lbank from '@assets/lbank.png';
import cup from '@assets/cup.png';
import Leaderboard from '@components/Home/Leaderboard';
import GraphSwiper from '@components/Home/GraphSwiper';

const Home: React.FC = () => {
	return (
		<PageWrapper violetHeader>
			<div className="home-page-header">
				<Typography variant="h3" fontWeight={600}>
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
								<HelpOutlineIcon color="sky" />
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
								<HelpOutlineIcon color="sky" />
							</Tooltip>
						</div>
						<div>
							<Typography variant="h6" component="p">
								Holders
							</Typography>
							<div className="count">32,306</div>
						</div>
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
								<HelpOutlineIcon color="sky" />
							</Tooltip>
						</div>
						<div>
							<Typography variant="h6" component="p">
								Total Transactions
							</Typography>
							<div className="count">
								1,786,573 <span>(12.8 TPS)</span>
							</div>
						</div>
					</div>
					<Divider
						sx={{
							marginY: 3,
						}}
					/>
					<div className="box-content">
						<div className="box-icon">
							<Tooltip title="Number of tasks that have been launched" arrow>
								<HelpOutlineIcon color="sky" />
							</Tooltip>
						</div>
						<div>
							<Typography variant="h6" component="p">
								Total Number of Tasks
							</Typography>
							<div className="count">2,658,409</div>
						</div>
					</div>
				</div>
				<div className="home-page-box">
					<GraphSwiper />
				</div>
			</div>
			<span className="home-page-find-title-mobile">Find HMT at</span>
			<SimpleBar>
				<div className="home-page-find">
					<span>Find HMT at</span>
					<span>
						<img src={bitfinex} alt="logo" />
						Bitfinex
					</span>
					<span>
						<img src={probitGlobal} alt="logo" />
						Probit Global
					</span>
					<span>
						<img src={gate} alt="logo" />
						Gate.io
					</span>
					<span>
						<img src={bing} alt="logo" />
						BingX
					</span>
					<span>
						<img src={coinlist} alt="logo" />
						Coinlist Pro
					</span>
					<span>
						<img src={lbank} alt="logo" />
						LBank
					</span>
				</div>
			</SimpleBar>

			<ShadowIcon
				className="home-page-leaderboard"
				title="Leaderboard"
				img={cup}
			/>

			<Leaderboard pagination />
		</PageWrapper>
	);
};

export default Home;
