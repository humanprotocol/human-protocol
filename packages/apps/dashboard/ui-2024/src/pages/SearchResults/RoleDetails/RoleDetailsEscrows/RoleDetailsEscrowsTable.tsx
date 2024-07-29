import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { AddressDetailsLeader } from '@services/api/use-address-details';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import { EscrowsTableBody } from '@pages/SearchResults/RoleDetails/RoleDetailsEscrows/tableComponents/EscrowsTableBody';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import { useEscrowDetailsDto } from '@utils/hooks/use-escrows-details-dto';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

export const RoleDetailsEscrowsTable = ({
	role,
}: {
	role: AddressDetailsLeader['role'];
}) => {
	const {
		pagination: { page, pageSize, lastPageIndex },
		setPageSize,
		setNextPage,
		setPrevPage,
	} = useEscrowDetailsDto();

	return (
		<Card
			sx={{
				paddingX: { xs: 2, md: 8 },
				paddingY: { xs: 4, md: 6 },
				marginBottom: 4,
			}}
		>
			<Box>
				<Typography
					sx={{
						marginBottom: 3,
					}}
					variant="h5"
				>
					Escrows
				</Typography>
				<TableContainer>
					<Table
						sx={{
							minWidth: 800,
							'& .MuiTableCell-root': {
								borderBottom: 'none',
							},
						}}
						aria-label="simple-table"
					>
						<TableHead>
							<TableRow></TableRow>
						</TableHead>
						<EscrowsTableBody role={role} />
						<TableFooter>
							<TablePagination
								// count is unknown but required as props
								count={9999}
								// onPageChange is required as props
								onPageChange={() => {}}
								page={page}
								rowsPerPage={pageSize}
								onRowsPerPageChange={(event) => {
									setPageSize(Number(event.target.value));
								}}
								rowsPerPageOptions={[5, 10]}
								labelDisplayedRows={({ from, to }) => {
									return `${from}–${to}`;
								}}
								slotProps={{
									actions: {
										nextButton: {
											onClick: () => {
												setNextPage();
											},
											disabled:
												lastPageIndex !== undefined &&
												(page === lastPageIndex || lastPageIndex - 1 === page),
										},
										previousButton: {
											onClick: () => {
												setPrevPage();
											},
										},
									},
								}}
							/>
						</TableFooter>
					</Table>
				</TableContainer>
			</Box>
		</Card>
	);
};
