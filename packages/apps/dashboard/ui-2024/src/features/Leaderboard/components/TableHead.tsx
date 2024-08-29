import React from 'react';
import MuiTableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import Tooltip from '@mui/material/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import { SelectNetwork } from './SelectNetwork';
import { colorPalette } from '@assets/styles/color-palette';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';
import { Order, SortableFieldsInLeaderBoardData } from '../helpers/sorting';

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
				{mobile.isMobile ? null : <TableCell></TableCell>}
				<TableCell
					sx={{
						[mobile.mediaQuery]: {
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
					key="amountStaked"
					sortDirection={orderBy === 'amountStaked' ? order : false}
				>
					<TableSortLabel
						active={orderBy === 'amountStaked'}
						direction={orderBy === 'amountStaked' ? order : 'asc'}
						onClick={createSortHandler('amountStaked')}
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
					<SelectNetwork />
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
						active={orderBy === 'fee'}
						direction={orderBy === 'fee' ? order : 'asc'}
						onClick={createSortHandler('fee')}
					>
						OPERATOR FEE
					</TableSortLabel>
				</TableCell>
			</TableRow>
		</MuiTableHead>
	);
};
