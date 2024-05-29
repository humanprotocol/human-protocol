import React, { Dispatch, SetStateAction, useState } from 'react';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import HumanIcon from '@components/Icons/HumanIcon';
import EthereumIcon from '@components/Icons/EthereumIcon';
import BinanceSmartChainIcon from '@components/Icons/BinanceSmartChainIcon';
import PolygonIcon from '@components/Icons/PolygonIcon';
import MoonbeamIcon from '@components/Icons/MoonbeamIcon';
import MoonbaseAlphaIcon from '@components/Icons/MoonbaseAlphaIcon';
import SvgIcon from '@mui/material/SvgIcon';
import CeloIcon from '@assets/icons/celo.svg';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import Tooltip from '@mui/material/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import recording from '@assets/recording.png';
import reputation from '@assets/reputation.png';
import exchange from '@assets/exchange.png';
import human from '@assets/human.png';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import SimpleBar from 'simplebar-react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import Grid from '@mui/material/Grid';
import AbbreviateClipboard from '@components/SearchResults/AbbreviateClipboard';
import { useNavigate } from 'react-router-dom';
import { TablePagination } from '@mui/material';

type networkTypes =
	| 'ethereum'
	| 'goerli'
	| 'binance'
	| 'testnet'
	| 'polygon'
	| 'mumbai'
	| 'moonbeam'
	| 'alpha';

interface Item {
	role: string;
	address: string;
	stake: string;
	network: networkTypes;
	reputation: string;
	operator: string;
}

function createData(
	role: string,
	address: string,
	stake: string,
	network: networkTypes,
	reputation: string,
	operator: string
) {
	return { role, address, stake, network, reputation, operator };
}

const rows = [
	createData(
		'Job Launcher',
		'0x67499f129433b82e5a4e412143a395e032e76c0dc0f83606031',
		'1e-18 HMT',
		'testnet',
		'Medium',
		'1%'
	),
	createData(
		'Recording Oracle',
		'0x67499f129433b82e5a4e412143a395e032e76c0dc0f83606031',
		'1e-18 HMT',
		'mumbai',
		'High',
		'1%'
	),
	createData(
		'Reputation Oracle',
		'0x67499f129433b82e5a4e412143a395e032e76c0dc0f83606031',
		'3e-18 HMT',
		'polygon',
		'Medium',
		'2%'
	),
	createData(
		'Exchange Oracle',
		'0x67499f129433b82e5a4e412143a395e032e76c0dc0f83606031',
		'4e-18 HMT',
		'ethereum',
		'Low',
		'1%'
	),
	createData(
		'HUMAN App',
		'0x67499f129433b82e5a4e412143a395e032e76c0dc0f83606031',
		'2e-18 HMT',
		'moonbeam',
		'Coming soon',
		'5%'
	),
];

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
	if (b[orderBy] < a[orderBy]) {
		return -1;
	}
	if (b[orderBy] > a[orderBy]) {
		return 1;
	}
	return 0;
}

type Order = 'asc' | 'desc';

function getComparator<Key extends keyof never>(
	order: Order,
	orderBy: Key
): (
	a: { [key in Key]: number | string },
	b: { [key in Key]: number | string }
) => number {
	return order === 'desc'
		? (a, b) => descendingComparator(a, b, orderBy)
		: (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort<T>(
	array: readonly T[],
	comparator: (a: T, b: T) => number
) {
	const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
	stabilizedThis.sort((a, b) => {
		const order = comparator(a[0], b[0]);
		if (order !== 0) {
			return order;
		}
		return a[1] - b[1];
	});
	return stabilizedThis.map((el) => el[0]);
}

const SelectNetwork = ({
	value,
	setNetwork,
}: {
	value: string;
	setNetwork: Dispatch<SetStateAction<string>>;
}) => {
	const handleChange = (event: SelectChangeEvent) => {
		setNetwork(event.target.value as networkTypes);
	};

	return (
		<FormControl fullWidth size="small">
			<InputLabel id="network-select-label">By Network</InputLabel>
			<Select
				labelId="network-select-label"
				id="network-select"
				value={value}
				label="By Network"
				onChange={handleChange}
			>
				<MenuItem className="select-item" value={'all'}>
					<HumanIcon />
					All Networks
				</MenuItem>
				<MenuItem className="select-item" value={'ethereum'}>
					<EthereumIcon />
					Ethereum
				</MenuItem>
				<MenuItem className="select-item" value={'goerli'}>
					<EthereumIcon />
					Ethereum Goerli
				</MenuItem>
				<MenuItem className="select-item" value={'binance'}>
					<BinanceSmartChainIcon />
					Binance Smart Chain
				</MenuItem>
				<MenuItem className="select-item" value={'testnet'}>
					<BinanceSmartChainIcon /> Smart Chain (Testnet)
				</MenuItem>
				<MenuItem className="select-item" value={'polygon'}>
					<PolygonIcon />
					Polygon
				</MenuItem>
				<MenuItem className="select-item" value={'mumbai'}>
					<PolygonIcon />
					Polygon Mumbai
				</MenuItem>
				<MenuItem className="select-item" value={'moonbeam'}>
					<MoonbeamIcon />
					Moonbeam
				</MenuItem>
				<MenuItem className="select-item" value={'alpha'}>
					<MoonbaseAlphaIcon />
					Moonbase Alpha
				</MenuItem>
				<MenuItem className="select-item" value={'celo'}>
					<SvgIcon>
						<CeloIcon />
					</SvgIcon>
					Celo
				</MenuItem>
				<MenuItem className="select-item" value={'alfajores'}>
					<SvgIcon>
						<CeloIcon />
					</SvgIcon>
					Celo Alfajores
				</MenuItem>
			</Select>
		</FormControl>
	);
};

interface EnhancedTableHeadProps {
	onRequestSort: (
		event: React.MouseEvent<unknown>,
		property: keyof Item
	) => void;
	order: Order;
	orderBy: string;
	rowCount: number;
	network: string;
	setNetwork: Dispatch<SetStateAction<string>>;
}

function EnhancedTableHead({
	orderBy,
	order,
	onRequestSort,
	network,
	setNetwork,
}: EnhancedTableHeadProps) {
	const createSortHandler =
		(property: keyof Item) => (event: React.MouseEvent<unknown>) => {
			onRequestSort(event, property);
		};

	return (
		<TableHead>
			<TableRow className="home-page-table-header">
				<TableCell
					key="role"
					sortDirection={orderBy === 'role' ? order : false}
				>
					<TableSortLabel
						active={orderBy === 'role'}
						direction={orderBy === 'role' ? order : 'asc'}
						onClick={createSortHandler('role')}
					>
						ROLE
					</TableSortLabel>
				</TableCell>
				<TableCell
					key="address"
					sortDirection={orderBy === 'address' ? order : false}
				>
					<TableSortLabel
						active={orderBy === 'address'}
						direction={orderBy === 'address' ? order : 'asc'}
						onClick={createSortHandler('address')}
					>
						<div className="icon-table">
							<Tooltip title="Address of the role" arrow>
								<HelpOutlineIcon color="sky" />
							</Tooltip>
							<span>ADDRESS</span>
						</div>
					</TableSortLabel>
				</TableCell>
				<TableCell
					key="stake"
					sortDirection={orderBy === 'stake' ? order : false}
				>
					<TableSortLabel
						active={orderBy === 'stake'}
						direction={orderBy === 'stake' ? order : 'asc'}
						onClick={createSortHandler('stake')}
					>
						<div className="icon-table">
							<Tooltip title="Amount of HMT staked" arrow>
								<HelpOutlineIcon color="sky" />
							</Tooltip>
							<span>STAKE</span>
						</div>
					</TableSortLabel>
				</TableCell>
				<TableCell className="table-filter-select">
					<SelectNetwork value={network} setNetwork={setNetwork} />
					<span className="mobile-title">NETWORK</span>
				</TableCell>
				<TableCell
					key="reputation"
					sortDirection={orderBy === 'reputation' ? order : false}
				>
					<TableSortLabel
						active={orderBy === 'reputation'}
						direction={orderBy === 'reputation' ? order : 'asc'}
						onClick={createSortHandler('reputation')}
					>
						<div className="icon-table">
							<Tooltip
								title="Reputation of the role as per their activities "
								arrow
							>
								<HelpOutlineIcon color="sky" />
							</Tooltip>
							<span>REPUTATION SCORE</span>
						</div>
					</TableSortLabel>
				</TableCell>
				<TableCell
					key="operator"
					sortDirection={orderBy === 'operator' ? order : false}
				>
					<TableSortLabel
						active={orderBy === 'operator'}
						direction={orderBy === 'operator' ? order : 'asc'}
						onClick={createSortHandler('reputation')}
					>
						OPERATOR FEE
					</TableSortLabel>
				</TableCell>
			</TableRow>
		</TableHead>
	);
}

const renderIcon: React.FC<Item> = (item) => {
	let src = '';
	switch (item.role) {
		case 'Job Launcher':
			return (
				<div className="icon-table">
					<span>JL</span>
				</div>
			);
		case 'Recording Oracle':
			src = recording;
			break;
		case 'Reputation Oracle':
			src = reputation;
			break;
		case 'Exchange Oracle':
			src = exchange;
			break;
		case 'HUMAN App':
			src = human;
			break;
		default:
			src = human;
			break;
	}

	return (
		<div className="icon-table">
			<img src={src} alt="logo" />
		</div>
	);
};

const Leaderboard = ({ pagination = false }: { pagination?: boolean }) => {
	const navigate = useNavigate();
	const [network, setNetwork] = useState('all');
	const [order, setOrder] = React.useState<Order>('asc');
	const [orderBy, setOrderBy] = React.useState<keyof Item>('role');
	const [page, setPage] = React.useState(0);
	const [rowsPerPage, setRowsPerPage] = React.useState(5);

	const handleRequestSort = (
		_event: React.MouseEvent<unknown>,
		property: keyof Item
	) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

	const visibleRows = React.useMemo(() => {
		let filteredRows = rows;
		if (network !== 'all') {
			filteredRows = rows.filter((elem) => elem.network === network);
		}

		const sortedRows = stableSort(filteredRows, getComparator(order, orderBy));

		return sortedRows.slice(
			page * rowsPerPage,
			page * rowsPerPage + rowsPerPage
		);
	}, [order, orderBy, page, rowsPerPage, network]);

	const renderNetworkDetails = (network: networkTypes) => {
		const networkDetails = {
			ethereum: {
				title: 'Ethereum',
				icon: <EthereumIcon />,
			},
			goerli: {
				title: 'Ethereum Goreli',
				icon: <EthereumIcon />,
			},
			binance: {
				title: 'Binance Smart Chain',
				icon: <BinanceSmartChainIcon />,
			},
			testnet: {
				title: 'Smart Chain (Testnet)',
				icon: <BinanceSmartChainIcon />,
			},
			polygon: {
				title: 'Polygon',
				icon: <PolygonIcon />,
			},
			mumbai: {
				title: 'Polygon Mumbai',
				icon: <PolygonIcon />,
			},
			moonbeam: {
				title: 'Moonbeam',
				icon: <MoonbeamIcon />,
			},
			alpha: {
				title: 'Moonbase Alpha',
				icon: <MoonbeamIcon />,
			},
			celo: {
				title: 'Celo',
				icon: <CeloIcon />,
			},
			alfajores: {
				title: 'alfajores',
				icon: <CeloIcon />,
			},
		};

		if (network === undefined) {
			return null;
		}

		return (
			<>
				{networkDetails[network].icon}
				{networkDetails[network].title}
			</>
		);
	};

	const renderReputation: React.FC<Item> = (item) => {
		switch (item.reputation) {
			case 'Medium':
				return (
					<div className="reputation-table reputation-table-medium">
						{item.reputation}
					</div>
				);
			case 'High':
				return (
					<div className="reputation-table reputation-table-high">
						{item.reputation}
					</div>
				);
			case 'Low':
				return (
					<div className="reputation-table reputation-table-low">
						{item.reputation}
					</div>
				);
			case 'Coming soon':
				return (
					<div className="reputation-table reputation-table-soon">
						{item.reputation}
					</div>
				);
			default:
				return (
					<div className="reputation-table reputation-table-soon">
						{item.reputation}
					</div>
				);
		}
	};

	const handleChangePage = (
		_event: React.MouseEvent<HTMLButtonElement> | null,
		newPage: number
	) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (
		event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setRowsPerPage(parseInt(event.target.value));
		setPage(0);
	};

	return (
		<>
			<TableContainer
				component={Paper}
				sx={{ padding: '32px', marginTop: '30px' }}
			>
				<div className="mobile-select">
					<SelectNetwork value={network} setNetwork={setNetwork} />
				</div>
				<SimpleBar>
					<Table
						sx={{
							minWidth: 650,
							[`& .${tableCellClasses.root}`]: {
								borderBottom: 'none',
							},
						}}
						aria-label="simple table"
					>
						<EnhancedTableHead
							onRequestSort={handleRequestSort}
							order={order}
							orderBy={orderBy}
							rowCount={rows.length}
							network={network}
							setNetwork={setNetwork}
						/>
						<TableBody>
							{visibleRows.map((row) => (
								<TableRow
									onClick={() => navigate(`/search/${row.address}`)}
									key={row.role}
									className="home-page-table-row"
								>
									<TableCell>
										{renderIcon(row)}
										{row.role}
									</TableCell>
									<TableCell>
										<Grid
											container
											wrap="nowrap"
											alignItems="center"
											sx={{ gap: '18px' }}
										>
											<AbbreviateClipboard value={row.address} />
										</Grid>
									</TableCell>
									<TableCell>{row.stake}</TableCell>
									<TableCell>
										<Grid
											container
											wrap="nowrap"
											alignItems="center"
											sx={{ gap: '18px' }}
										>
											{renderNetworkDetails(row.network)}
										</Grid>
									</TableCell>
									<TableCell>{renderReputation(row)}</TableCell>
									<TableCell>{row.operator}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</SimpleBar>
			</TableContainer>
			{pagination && (
				<TablePagination
					rowsPerPageOptions={[5, 10]}
					component="div"
					count={rows.length}
					rowsPerPage={rowsPerPage}
					page={page}
					onPageChange={handleChangePage}
					onRowsPerPageChange={handleChangeRowsPerPage}
				/>
			)}
		</>
	);
};

export default Leaderboard;
