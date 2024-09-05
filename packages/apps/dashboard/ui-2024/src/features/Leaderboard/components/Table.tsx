import React, { useCallback, useEffect, useMemo, useState } from 'react';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import MuiTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import Grid from '@mui/material/Grid';
import AbbreviateClipboard from '@components/SearchResults/AbbreviateClipboard';
import { ReputationLabel } from './ReputationLabel';
import { EntityIcon } from './EntityIcon';
import { TableHead } from './TableHead';
import { LeaderBoardData } from '@services/api/use-leaderboard-details';
import {
	getComparator,
	Order,
	SortableFieldsInLeaderBoardData,
	stableSort,
} from '../helpers/sorting';
import { useLeaderboardSearch } from '@utils/hooks/use-leaderboard-search';
import { getNetwork } from '@utils/config/networks';
import { NetworkIcon } from '@components/NetworkIcon';
import { colorPalette } from '@assets/styles/color-palette';
import { TableRow, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import { handleErrorMessage } from '@services/handle-error-message';
import Loader from '@components/Loader';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';

const ROWS_SPACING = '4px';

export const Table = ({
	data = [],
	status,
	error,
}: {
	data: LeaderBoardData | undefined;
	status: 'success' | 'error' | 'pending';
	error: unknown;
}) => {
	const { mobile } = useBreakPoints();
	const [visibleTablePartWidth, setVisibleTablePartWidth] = useState(0);

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

	const handleVisibleTablePart = useCallback(() => {
		const width = document.querySelector(
			'.simplebar-scrollable-x'
		)?.clientWidth;
		if (width) {
			setVisibleTablePartWidth(width);
		}
	}, []);

	useEffect(() => {
		handleVisibleTablePart();
		window.addEventListener('resize', handleVisibleTablePart);
		return () => {
			window.removeEventListener('resize', handleVisibleTablePart);
		};
	}, [handleVisibleTablePart, status]);

	useEffect(() => {
		handleVisibleTablePart();
		// eslint-disable-next-line react-hooks/exhaustive-deps -- ...
	}, []);

	return (
		<MuiTable
			sx={{
				minWidth: 650,
				minHeight: tableMinHeight,
				borderCollapse: 'collapse',
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
					<TableBodyWrapper
						width={
							visibleTablePartWidth ? `${visibleTablePartWidth}px` : undefined
						}
					>
						<Loader height="30vh" />
					</TableBodyWrapper>
				) : null}

				{status === 'error' ? (
					<TableBodyWrapper
						width={
							visibleTablePartWidth ? `${visibleTablePartWidth}px` : undefined
						}
					>
						{handleErrorMessage(error)}
					</TableBodyWrapper>
				) : null}

				{tableIsEmpty ? (
					<TableBodyWrapper
						width={
							visibleTablePartWidth ? `${visibleTablePartWidth}px` : undefined
						}
					>
						No data
					</TableBodyWrapper>
				) : (
					<>
						{visibleRows.map((row, index) => (
							<TableRow
								key={index + row.address}
								className={'home-page-table-row'}
								sx={{
									paddingTop: '1px',
									borderTop: `4px solid ${colorPalette.whiteBackground}`,
									':hover': {
										backgroundColor: colorPalette.overlay.light,
									},
									':first-child': {
										borderTop: `15px solid ${colorPalette.whiteBackground}`,
									},
									':last-child': {
										borderBottom: `15px solid ${colorPalette.whiteBackground}`,
									},
									textDecoration: 'none',
								}}
							>
								{mobile.isMobile ? null : (
									<TableCell sx={{ marginTop: '5px' }}>
										<Typography variant="body1">{index + 1}</Typography>
									</TableCell>
								)}
								<TableCell
									sx={{
										justifyContent: 'flex-start',
										[mobile.mediaQuery]: {
											position: 'sticky',
											left: 0,
											zIndex: 2,
											backgroundColor: colorPalette.whiteBackground,
											'&::after': {
												...getAfterElementProperties(
													index === 0,
													visibleRows.length === index + 1
												),
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
										{mobile.isMobile ? (
											<>
												<Typography
													variant="subtitle2"
													sx={{ wordBreak: 'unset' }}
												>
													{row.role}
												</Typography>
											</>
										) : (
											<>
												<EntityIcon role={row.role} />
												<Typography variant="h6" sx={{ wordBreak: 'unset' }}>
													{row.role}
												</Typography>
											</>
										)}
									</Grid>
								</TableCell>
								<TableCell sx={{ justifyContent: 'flex-start' }}>
									<Grid
										container
										wrap="nowrap"
										alignItems="center"
										sx={{ gap: '18px' }}
									>
										<AbbreviateClipboard
											value={row.address}
											link={`/search/${row.chainId}/${row.address}`}
										/>
									</Grid>
								</TableCell>
								<TableCell sx={{ justifyContent: 'flex-start' }}>
									<Typography variant="body1">
										{row.amountStaked} HMT
									</Typography>
								</TableCell>
								<TableCell>
									<Typography component="div" variant="body1">
										<Grid
											whiteSpace="nowrap"
											container
											wrap="nowrap"
											alignItems="center"
											justifyContent="flex-start"
											gap="6px"
										>
											<NetworkIcon chainId={row.chainId} />
											{getNetwork(row.chainId)?.name}
										</Grid>
									</Typography>
								</TableCell>
								<TableCell sx={{ justifyContent: 'flex-start' }}>
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

function TableBodyWrapper({
	children,
	width = '100%',
}: {
	children: JSX.Element | string;
	width?: string;
}) {
	return (
		<Stack
			component="tr"
			sx={{
				position: 'absolute',
				top: 0,
				left: 0,
				width,
				height: '100%',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<th>{children}</th>
		</Stack>
	);
}

function getAfterElementProperties(
	isFirstElement: boolean,
	isLastElement: boolean
) {
	if (isFirstElement) {
		return {
			content: '""',
			position: 'absolute',
			bottom: '0',
			right: '0',
			height: '100%',
			width: '1px',
		};
	}

	if (isLastElement) {
		return {
			content: '""',
			position: 'absolute',
			bottom: '0',
			right: '0',
			height: `calc(100% + ${ROWS_SPACING})`,
			width: '1px',
		};
	}

	return {
		content: '""',
		position: 'absolute',
		bottom: '0',
		right: '0',
		height: `calc(100% + ${ROWS_SPACING})`,
		width: '1px',
	};
}
