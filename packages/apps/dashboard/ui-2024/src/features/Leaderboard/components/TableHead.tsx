import React from 'react';
import MuiTableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Typography } from '@mui/material';

import { SelectNetwork } from './SelectNetwork';
import { colorPalette } from '@assets/styles/color-palette';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';
import { Order, SortableFieldsInLeaderBoardData } from '../helpers/sorting';
import CustomTooltip from '@components/CustomTooltip';

interface TableHeadProps {
	onRequestSort: (
		event: React.MouseEvent<unknown>,
		property: SortableFieldsInLeaderBoardData
	) => void;
	order: Order;
	orderBy: string;
	rowCount: number;
}

export const TableHead = ({
	orderBy,
	order,
	onRequestSort,
}: TableHeadProps) => {
	const { mobile } = useBreakPoints();
	const createSortHandler =
		(property: SortableFieldsInLeaderBoardData) =>
		(event: React.MouseEvent<unknown>) => {
			onRequestSort(event, property);
		};

	return (
		<MuiTableHead>
			<TableRow
				sx={{ whiteSpace: 'nowrap' }}
				className="home-page-table-header"
			>
				{mobile.isMobile ? null : (
					<TableCell sx={{ minWidth: '40px' }}></TableCell>
				)}
				<TableCell
					sx={{
						minWidth: '220px',
						px: '0.5rem',
						justifyContent: 'flex-start',
						[mobile.mediaQuery]: {
							minWidth: 'unset',
							px: '1rem',
							position: 'sticky',
							left: 0,
							zIndex: 2,
							backgroundColor: colorPalette.whiteSolid,
						},
					}}
					key="id"
					sortDirection={orderBy === 'role' ? order : false}
				>
					<TableSortLabel
						active={orderBy === 'role'}
						direction={orderBy === 'role' ? order : 'asc'}
						onClick={createSortHandler('role')}
					>
						<div className="icon-table">
							<Typography mt="3px" variant="body3">
								ROLE
							</Typography>
						</div>
					</TableSortLabel>
				</TableCell>
				<TableCell
					sx={{
						minWidth: '180px',
						px: '0.5rem',
						[mobile.mediaQuery]: { minWidth: 'unset', px: '1rem' },
					}}
					key="address"
					sortDirection={orderBy === 'address' ? order : false}
				>
					<TableSortLabel
						active={orderBy === 'address'}
						direction={orderBy === 'address' ? order : 'asc'}
						onClick={createSortHandler('address')}
					>
						<div className="icon-table">
							<CustomTooltip title="Address of the role" arrow>
								<HelpOutlineIcon
									style={{
										color: colorPalette.sky.main,
									}}
								/>
							</CustomTooltip>
							<Typography mt="3px" component="span" variant="body3">
								ADDRESS
							</Typography>
						</div>
					</TableSortLabel>
				</TableCell>
				<TableCell
					sx={{
						minWidth: '140px',
						px: '0.5rem',
						[mobile.mediaQuery]: { minWidth: 'unset', px: '1rem' },
					}}
					key="amountStaked"
					sortDirection={orderBy === 'amountStaked' ? order : false}
				>
					<TableSortLabel
						active={orderBy === 'amountStaked'}
						direction={orderBy === 'amountStaked' ? order : 'asc'}
						onClick={createSortHandler('amountStaked')}
					>
						<div className="icon-table">
							<CustomTooltip title="Amount of HMT staked" arrow>
								<HelpOutlineIcon
									style={{
										color: colorPalette.sky.main,
									}}
								/>
							</CustomTooltip>
							<Typography mt="3px" component="span" variant="body3">
								STAKE
							</Typography>
						</div>
					</TableSortLabel>
				</TableCell>
				<TableCell
					sx={{
						minWidth: '190px',
						px: '0.5rem',
						[mobile.mediaQuery]: { minWidth: 'unset', px: '1rem' },
					}}
					className="table-filter-select"
				>
					<SelectNetwork />
					<span className="mobile-title">NETWORK</span>
				</TableCell>
				<TableCell
					sx={{
						minWidth: '170px',
						px: '0.5rem',
						[mobile.mediaQuery]: { minWidth: 'unset', px: '1rem' },
					}}
					key="reputation"
					sortDirection={orderBy === 'reputation' ? order : false}
				>
					<TableSortLabel
						active={orderBy === 'reputation'}
						direction={orderBy === 'reputation' ? order : 'asc'}
						onClick={createSortHandler('reputation')}
					>
						<div className="icon-table">
							<CustomTooltip
								title="Reputation of the role as per their activities "
								arrow
							>
								<HelpOutlineIcon
									style={{
										color: colorPalette.sky.main,
									}}
								/>
							</CustomTooltip>
							<Typography mt="3px" component="span" variant="body3">
								REPUTATION SCORE
							</Typography>
						</div>
					</TableSortLabel>
				</TableCell>
				<TableCell
					sx={{
						minWidth: '90px',
						px: '0.5rem',
						[mobile.mediaQuery]: {
							padding: '1rem',
							minWidth: 'unset',
						},
					}}
					key="operator"
					sortDirection={orderBy === 'operator' ? order : false}
				>
					<TableSortLabel
						active={orderBy === 'fee'}
						direction={orderBy === 'fee' ? order : 'asc'}
						onClick={createSortHandler('fee')}
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignSelf: 'center',
						}}
					>
						<Typography mt="3px" variant="body3" component="div">
							OPERATOR FEE
						</Typography>
					</TableSortLabel>
				</TableCell>
			</TableRow>
		</MuiTableHead>
	);
};
