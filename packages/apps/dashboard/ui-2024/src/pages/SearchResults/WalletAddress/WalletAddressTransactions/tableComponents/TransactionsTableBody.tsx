import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import MuiTableBody from '@mui/material/TableBody';
import AbbreviateClipboard from '@components/SearchResults/AbbreviateClipboard';
import { useTransactionDetails } from '@services/api/use-transaction-details';
import { useEffect } from 'react';
import { useTransactionDetailsDto } from '@utils/hooks/use-transactions-details-dto';
import { TransactionTableCellMethod } from '@pages/SearchResults/WalletAddress/WalletAddressTransactions/cells/TransactionTableCellMethod';
import { TransactionTableCellValue } from '@pages/SearchResults/WalletAddress/WalletAddressTransactions/cells/TransactionTableCellValue';
import { TransactionsTableBodyContainer } from '@pages/SearchResults/WalletAddress/WalletAddressTransactions/tableComponents/TransactionsTableBodyContainer';
import { handleErrorMessage } from '@services/handle-error-message';
import CircularProgress from '@mui/material/CircularProgress';

export const TransactionsTableBody = () => {
	const { data, isPending, isError, error } = useTransactionDetails();
	const {
		setLastPageIndex,
		setPrevPage,
		pagination: { page },
	} = useTransactionDetailsDto();

	useEffect(() => {
		if (data?.results.length === 0) {
			setLastPageIndex(page);
			setPrevPage();
		}
	}, [data?.results, page, setLastPageIndex, setPrevPage]);

	if (isPending) {
		return (
			<TransactionsTableBodyContainer>
				<CircularProgress />
			</TransactionsTableBodyContainer>
		);
	}

	if (isError) {
		return (
			<TransactionsTableBodyContainer>
				<div>{handleErrorMessage(error)}</div>
			</TransactionsTableBodyContainer>
		);
	}

	if (!data.results.length) {
		return (
			<TransactionsTableBodyContainer>
				<div>No data</div>
			</TransactionsTableBodyContainer>
		);
	}

	return (
		<MuiTableBody>
			{data.results.map((elem, idx) => (
				<TableRow key={idx}>
					<TableCell
						sx={{
							p: 0,
						}}
					>
						<AbbreviateClipboard value={elem.txHash} />
					</TableCell>
					<TableCell>
						<TransactionTableCellMethod method={elem.method} />
					</TableCell>
					<TableCell>{elem.block}</TableCell>
					<TableCell>
						<TransactionTableCellValue value={elem.value} />
					</TableCell>
					<TableCell>
						<AbbreviateClipboard value={elem.to} />
					</TableCell>
				</TableRow>
			))}
		</MuiTableBody>
	);
};
