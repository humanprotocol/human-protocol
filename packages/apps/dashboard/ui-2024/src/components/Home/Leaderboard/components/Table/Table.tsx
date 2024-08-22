import React, { useMemo, useState } from 'react';
import TableRow from '@mui/material/TableRow';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import MuiTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import Grid from '@mui/material/Grid';
import AbbreviateClipboard from '@components/SearchResults/AbbreviateClipboard';
import { useNavigate } from 'react-router-dom';
import { ReputationLabel } from '@components/Home/Leaderboard/components/ReputationLabel';
import { EntityIcon } from '@components/Home/Leaderboard/components/EntityIcon';
import { TableHead } from '@components/Home/Leaderboard/components/Table/TableHead';
import { LeaderBoardData } from '@services/api/use-leaderboard-details';
import {
	getComparator,
	Order,
	SortableFieldsInLeaderBoardData,
	stableSort,
} from '@components/Home/Leaderboard/components/Table/sorting';
import { useLeaderboardSearch } from '@utils/hooks/use-leaderboard-search';
import { getNetwork } from '@utils/config/networks';
import { NetworkIcon } from '@components/NetworkIcon';
import { colorPalette } from '@assets/styles/color-palette';
import { Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import { handleErrorMessage } from '@services/handle-error-message';
import Loader from '@components/Loader';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';

const TableBodyWrapper = ({ children }: { children: JSX.Element | string }) => {
	return (
		<Stack
			sx={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			{children}
		</Stack>
	);
};

export const Table = ({
	data = [],
	status,
	error,
}: {
	data: LeaderBoardData | undefined;
	status: 'success' | 'error' | 'pending';
	error: unknown;
}) => {
	const navigate = useNavigate();
	const { mobile } = useBreakPoints();

	const {
		filterParams: { chainId },
	} = useLeaderboardSearch();
	const [order, setOrder] = useState<Order>('asc');
	const [orderBy, setOrderBy] =
		useState<SortableFieldsInLeaderBoardData>('role');

	const handleRequestSort = (
		_event: React.MouseEvent<unknown>,
		property: SortableFieldsInLeaderBoardData
	) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

	const visibleRows = useMemo(() => {
		let filteredRows = data;
		if (chainId !== -1) {
			filteredRows = data.filter((elem) => elem.chainId === chainId);
		}
		return stableSort(filteredRows, getComparator(order, orderBy));
	}, [chainId, data, order, orderBy]);

	const tableIsEmpty = status === 'success' && visibleRows.length === 0;
	const tableMinHeight = status === 'success' && !tableIsEmpty ? 'unset' : 400;

	return (
		<MuiTable
			sx={{
				minWidth: 650,
				minHeight: tableMinHeight,
				borderCollapse: 'separate',
				[`& .${tableCellClasses.root}`]: {
					borderBottom: 'none',
				},
			}}
			aria-label="simple table"
		>
			<TableHead
				onRequestSort={handleRequestSort}
				order={order}
				orderBy={orderBy}
				rowCount={data.length}
			/>
			<TableBody
				sx={{
					position: 'relative',
				}}
			>
				{status === 'pending' ? (
					<TableBodyWrapper>
						<Loader height="30vh" />
					</TableBodyWrapper>
				) : null}

				{status === 'error' ? (
					<TableBodyWrapper>{handleErrorMessage(error)}</TableBodyWrapper>
				) : null}

				{tableIsEmpty ? (
					<TableBodyWrapper>No data</TableBodyWrapper>
				) : (
					<>
						{visibleRows.map((row, index) => (
							<TableRow
								onClick={() =>
									navigate(`/search/${row.chainId}/${row.address}`, {
										preventScrollReset: false,
									})
								}
								key={row.address + index}
								className="home-page-table-row"
								sx={{
									paddingTop: '1px',
									':hover': {
										backgroundColor: colorPalette.overlay.light,
									},
								}}
							>
								{mobile.isMobile ? null : (
									<TableCell>
										<Typography variant="body1">{index + 1}</Typography>
									</TableCell>
								)}
								<TableCell
									sx={{
										[mobile.mediaQuery]: {
											position: 'sticky',
											left: 0,
											zIndex: 2,
											backgroundColor: colorPalette.whiteBackground,
											'&::after': {
												content: '""',
												position: 'absolute',
												bottom: '0',
												right: '0',
												height: index === 0 ? '85%' : '100%',
												width: '1px',
												backgroundColor: `${colorPalette.skyOpacity}`,
											},
										},
									}}
								>
									<Grid
										container
										wrap="nowrap"
										alignItems="center"
										gap="8px"
										justifyContent="flex-start"
									>
										{mobile.isMobile ? null : <EntityIcon role={row.role} />}
										<Typography variant="subtitle2" sx={{ wordBreak: 'unset' }}>
											{row.role}
										</Typography>
									</Grid>
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
								<TableCell>{row.amountStaked} HMT</TableCell>
								<TableCell>
									<Grid
										container
										wrap="nowrap"
										alignItems="center"
										justifyContent="center"
									>
										<NetworkIcon chainId={row.chainId} />
										{getNetwork(row.chainId)?.name}
									</Grid>
								</TableCell>
								<TableCell>
									<ReputationLabel reputation={row.reputation} />
								</TableCell>
								<TableCell>{row.fee}%</TableCell>
							</TableRow>
						))}
					</>
				)}
			</TableBody>
		</MuiTable>
	);
};
