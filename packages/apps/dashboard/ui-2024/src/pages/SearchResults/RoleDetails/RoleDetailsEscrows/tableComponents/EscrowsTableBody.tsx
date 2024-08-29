import TableCell from '@mui/material/TableCell';
import MuiTableBody from '@mui/material/TableBody';
import { useEffect } from 'react';
import { handleErrorMessage } from '@services/handle-error-message';
import CircularProgress from '@mui/material/CircularProgress';
import { EscrowsTableBodyContainer } from '@pages/SearchResults/RoleDetails/RoleDetailsEscrows/tableComponents/EscrowsTableBodyContainer';
import { useEscrowDetails } from '@services/api/use-escrows-details';
import { AddressDetailsLeader } from '@services/api/use-address-details';
import { useEscrowDetailsDto } from '@utils/hooks/use-escrows-details-dto';
import { useWalletSearch } from '@utils/hooks/use-wallet-search';
import { useNavigate } from 'react-router-dom';
import { Stack } from '@mui/material';
import { TableRowWithCustomContextMenu } from '@components/TableRowWithCustomContextMenu/TableRowWithCustomContextMenu';

export const EscrowsTableBody = ({
	role,
}: {
	role: AddressDetailsLeader['role'];
}) => {
	const navigate = useNavigate();
	const { filterParams } = useWalletSearch();
	const { data, isPending, isError, error } = useEscrowDetails({ role });
	const {
		setLastPageIndex,
		setPrevPage,
		pagination: { page },
	} = useEscrowDetailsDto();

	useEffect(() => {
		if (data?.results.length === 0) {
			setLastPageIndex(page);
			setPrevPage();
		}
	}, [data?.results, page, setLastPageIndex, setPrevPage]);

	useEffect(() => {
		setLastPageIndex(undefined);
	}, [filterParams.address, filterParams.chainId, setLastPageIndex]);

	if (isPending) {
		return (
			<EscrowsTableBodyContainer>
				<CircularProgress />
			</EscrowsTableBodyContainer>
		);
	}

	if (isError) {
		return (
			<EscrowsTableBodyContainer>
				<div>{handleErrorMessage(error)}</div>
			</EscrowsTableBodyContainer>
		);
	}

	if (!data.results.length) {
		return (
			<EscrowsTableBodyContainer>
				<div>No escrows launched yet</div>
			</EscrowsTableBodyContainer>
		);
	}

	return (
		<MuiTableBody>
			{data.results.map((elem, idx) => (
				<TableRowWithCustomContextMenu
					newTabLink={`/search/${filterParams.chainId}/${elem.address}`}
					key={idx}
				>
					<TableCell
						sx={{
							padding: '0 0 24px 0',
						}}
					>
						<Stack
							sx={{
								':hover': {
									cursor: 'pointer',
								},
							}}
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								navigate(`/search/${filterParams.chainId}/${elem.address}`);
							}}
						>
							<a
								target="_blank"
								href={`/search/${filterParams.chainId}/${elem.address}`}
								style={{
									textDecoration: 'unset',
								}}
							>
								{elem.address}
							</a>
						</Stack>
					</TableCell>
				</TableRowWithCustomContextMenu>
			))}
		</MuiTableBody>
	);
};
