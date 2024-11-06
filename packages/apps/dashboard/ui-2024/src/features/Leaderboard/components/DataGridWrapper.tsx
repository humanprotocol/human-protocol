import { LeaderBoardData } from '@services/api/use-leaderboard-details';
import { Box, Typography } from '@mui/material';
import { handleErrorMessage } from '@services/handle-error-message';
import Loader from '@components/Loader';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';
import { DataGrid, useGridApiRef } from '@mui/x-data-grid';
import { useState } from 'react';

import { useDataGrid } from '../hooks/useDataGrid';

export const DataGridWrapper = ({
	data = [],
	status,
	error,
}: {
	data: LeaderBoardData | undefined;
	status: 'success' | 'error' | 'pending';
	error: unknown;
}) => {
	const apiRef = useGridApiRef();
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_sorted, setSortedRows] = useState<number[]>([]);
	const { columns, visibleRows } = useDataGrid(data);
	const {
		mobile: { isMobile },
	} = useBreakPoints();

	const tableIsEmpty = status === 'success' && visibleRows.length === 0;
	const tableMinHeight = status === 'success' && !tableIsEmpty ? 'unset' : 300;

	return (
		<Box width="100%" height={tableMinHeight} sx={{ overflow: 'hidden' }}>
			<DataGrid
				disableColumnResize
				hideFooterPagination
				disableColumnMenu
				disableColumnSelector
				disableRowSelectionOnClick
				hideFooter
				disableVirtualization={isMobile}
				apiRef={apiRef}
				loading={status === 'pending'}
				rows={visibleRows}
				columns={columns}
				autosizeOptions={{
					expand: true,
				}}
				onSortModelChange={() => {
					// needs rerender to calculate the correct row number
					setSortedRows(apiRef.current.getSortedRows().map((row) => row.id));
				}}
				initialState={{
					sorting: {
						sortModel: [{ field: 'role', sort: 'asc' }],
					},
				}}
				slots={{
					noRowsOverlay() {
						if (status === 'error') {
							return handleErrorMessage(error);
						}

						return (
							<Box
								height="100%"
								display="flex"
								justifyContent="center"
								alignItems="center"
							>
								<Typography>No data</Typography>
							</Box>
						);
					},
					loadingOverlay() {
						return <Loader height="30vh" />;
					},
				}}
				rowHeight={125}
				columnHeaderHeight={72}
				sx={{
					position: 'relative',
					border: 0,
					marginBottom: '16px',
					'& .MuiDataGrid-cell': {
						borderTop: 'none',
						padding: '0 8px',
						overflow: 'visible !important',
					},
					'& .MuiDataGrid-row': {
						borderTop: isMobile ? '15px solid rgb(255, 255, 255)' : '',
					},
					'& .MuiDataGrid-row:hover': {
						background: 'rgba(20, 6, 178, 0.04)',
					},
					'& .MuiDataGrid-cell:focus': {
						outline: 'none',
					},
					'& .MuiDataGrid-cell:focus-within': {
						outline: 'none',
					},
					'& .MuiDataGrid-columnSeparator--sideRight': {
						display: 'none',
					},
					'& .MuiDataGrid-columnHeader': {
						padding: '0 16px',
						overflow: 'visible !important',
					},
					'& .MuiDataGrid-columnHeader:hover': {
						color: 'rgb(133, 142, 198)',
					},
					'& .MuiDataGrid-row--borderBottom .MuiDataGrid-withBorderColor': {
						borderColor: 'transparent',
					},
					'& .MuiDataGrid-overlayWrapper': {
						height: '100%',
					},
					'& .MuiDataGrid-columnHeaderTitleContainerContent ': {
						overflow: 'visible',
					},
					'& .pinned-column--header': {
						position: 'sticky',
						left: 0,
						zIndex: 1000,
						transform: 'translateZ(0)',
					},
					'& .pinned-column--cell': {
						position: 'sticky',
						left: 0,
						zIndex: 1000,
						background: '#fff',
						transform: 'translateZ(0)',
						borderRight: isMobile ? '1px solid rgb(224, 224, 224)' : '',
					},
					'& .MuiDataGrid-columnHeader:focus': {
						outline: 'none',
					},
					'& .MuiDataGrid-virtualScroller': {
						position: 'relative',
					},
					'& .MuiDataGrid-filler': {
						display: 'none',
					},
				}}
				getRowClassName={() => 'home-page-table-row'}
			/>
		</Box>
	);
};
