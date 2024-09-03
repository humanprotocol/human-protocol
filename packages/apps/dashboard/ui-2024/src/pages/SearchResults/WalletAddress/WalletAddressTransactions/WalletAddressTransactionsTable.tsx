import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import SimpleBar from 'simplebar-react';
import TablePagination from '@mui/material/TablePagination';
import { TransactionsTableHead } from '@pages/SearchResults/WalletAddress/WalletAddressTransactions/tableComponents/TransactionsTableHead';
import { TransactionsTableBody } from '@pages/SearchResults/WalletAddress/WalletAddressTransactions/tableComponents/TransactionsTableBody';
import { useTransactionDetailsDto } from '@utils/hooks/use-transactions-details-dto';
import { TableFooter } from '@mui/material';

export const WalletAddressTransactionsTable = () => {
	const {
		pagination: { page, pageSize, lastPageIndex },
		setPageSize,
		setNextPage,
		setPrevPage,
	} = useTransactionDetailsDto();

	return (
		<Card
			sx={{
				paddingX: { xs: 2, md: 8 },
				paddingY: { xs: 4, md: 6 },
			}}
		>
			<Typography sx={{ marginBottom: 2 }} variant="h5" component="p">
				Transactions
			</Typography>
			<TableContainer>
				<SimpleBar>
					<Table
						sx={{
							minWidth: 800,
							'& .MuiTableCell-root': {
								borderBottom: 'none',
							},
						}}
						aria-label="simple-table"
					>
						<TransactionsTableHead />
						<TransactionsTableBody />
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
				</SimpleBar>
			</TableContainer>
		</Card>
	);
};
