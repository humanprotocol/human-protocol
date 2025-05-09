import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { LoadingButton } from '@mui/lab';
import { Box, Card, Grid, IconButton, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { saveAs } from 'file-saver';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CardTextRow } from '../../../components/CardTextRow';
import { CopyAddressButton } from '../../../components/CopyAddressButton';
import { CopyLinkIcon } from '../../../components/Icons/CopyLinkIcon';
import { Table } from '../../../components/Table';
import { useJobDetails } from '../../../hooks/useJobDetails';
import { useSnackbar } from '../../../providers/SnackProvider';
import * as jobService from '../../../services/job';
import { JobStatus } from '../../../types';
import { generateDashboardURL } from '../../../utils';

const CardContainer = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  background: '#fff',
  boxShadow:
    '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
  padding: '24px 40px 36px',
  height: '100%',
  boxSizing: 'border-box',
}));

export default function JobDetail() {
  const { jobId: jobIdParam } = useParams();
  const jobId = Number(jobIdParam);
  const { data, isLoading, error, mutate } = useJobDetails(jobId);
  const [isCancelling, setIsCancelling] = useState(false);
  const { openSnackbar, showError } = useSnackbar();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDownloadingResults, setResultsDownloading] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await jobService.cancelJob(jobId);

      if (data) {
        mutate({
          ...data,
          details: { ...data.details, status: JobStatus.TO_CANCEL },
        });
      }
      openSnackbar('Job canceled', 'success');
    } catch (err: any) {
      showError(err);
    }
    setIsCancelling(false);
  };

  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDownloadDecryptedResultClick = async () => {
    try {
      setResultsDownloading(true);

      const { data, filename } = await jobService.downloadJobResult(jobId);
      const saveAsFilename =
        filename || `${data.details.escrowAddress}-results.zip`;

      saveAs(data, saveAsFilename);
    } catch (err) {
      showError(err);
    } finally {
      setResultsDownloading(false);
    }
  };

  const isCancellable =
    data?.details.status === JobStatus.FAILED ||
    data?.details.status === JobStatus.PAID ||
    data?.details.status === JobStatus.PENDING ||
    data?.details.status === JobStatus.PARTIAL ||
    data?.details.status === JobStatus.SET_UP ||
    data?.details.status === JobStatus.CREATED ||
    data?.details.status === JobStatus.LAUNCHED;

  if (isLoading) return <>Loading...</>;

  if (!data || error) return <>Failed to fetch job details. Try again later.</>;

  return (
    <Box>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }} mb={6}>
          <Typography variant="h4" fontWeight={600}>
            Job details
          </Typography>
          <CopyAddressButton address={data.details.escrowAddress} ml={6} />
        </Box>
        {isCancellable && (
          <LoadingButton
            sx={{ mb: 2 }}
            variant="contained"
            color="primary"
            loading={isCancelling}
            onClick={handleCancel}
          >
            Cancel
          </LoadingButton>
        )}
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <CardContainer>
              <Typography
                variant="body2"
                color="primary"
                fontWeight={600}
                sx={{ mb: 2 }}
              >
                Job details
              </Typography>
              <Stack spacing={2}>
                <CardTextRow
                  label="Manifest URL"
                  value={data.details.manifestUrl}
                />
                <CardTextRow
                  label="Manifest Hash"
                  value={data.details.manifestHash}
                />
                <CardTextRow
                  label="Balance"
                  value={`${data.details.balance} ${(data.details.currency ?? '').toUpperCase()}`}
                />
                <CardTextRow
                  label="Paid Out"
                  value={`${data.details.paidOut.toString()} ${(data.details.currency ?? '').toUpperCase()}`}
                />
              </Stack>
            </CardContainer>
          </Grid>
          <Grid item xs={12}>
            <CardContainer>
              <Typography
                variant="body2"
                color="primary"
                fontWeight={600}
                sx={{ mb: 2 }}
              >
                Job Manifest
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <CardTextRow
                      label="Network"
                      value={`${NETWORKS[data.manifest.chainId as ChainId]!.title} (${data.manifest.chainId})`}
                    />
                    {data.manifest.title && (
                      <CardTextRow label="Title" value={data.manifest.title} />
                    )}
                    <CardTextRow
                      label="Description"
                      value={data.manifest.description}
                    />
                    <CardTextRow
                      label={
                        data.manifest.requestType === 'FORTUNE'
                          ? "Fortune's request"
                          : 'Task size'
                      }
                      value={data.manifest.submissionsRequired}
                    />
                    <CardTextRow
                      label={'Status'}
                      value={data?.details.status}
                    />
                    <CardTextRow
                      label="Fund Amount"
                      value={`${data.manifest.fundAmount.toString()} ${(data.details.currency ?? '').toUpperCase()}`}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <CardTextRow
                      label="Token"
                      value={data.manifest.tokenAddress}
                    />
                    <CardTextRow
                      label="Job Requester"
                      value={data.manifest.requesterAddress}
                    />
                    <CardTextRow
                      label="Recording Oracle"
                      value={data.manifest.recordingOracleAddress}
                      url={generateDashboardURL(
                        data.manifest.chainId,
                        data.manifest.recordingOracleAddress,
                      )}
                    />
                    <CardTextRow
                      label="Reputation Oracle"
                      value={data.manifest.reputationOracleAddress}
                      url={generateDashboardURL(
                        data.manifest.chainId,
                        data.manifest.recordingOracleAddress,
                      )}
                    />
                    <CardTextRow
                      label="Exchange Oracle"
                      value={data.manifest.exchangeOracleAddress}
                      url={generateDashboardURL(
                        data.manifest.chainId,
                        data.manifest.exchangeOracleAddress,
                      )}
                    />
                  </Stack>
                </Grid>
              </Grid>
            </CardContainer>
          </Grid>
        </Grid>
      </Box>
      {data.results && (
        <Box sx={{ mt: 10 }}>
          <Typography variant="h4" fontWeight={600}>
            Job solutions
          </Typography>
          <Box sx={{ mt: 7 }}>
            {data.manifest.requestType === 'fortune' && (
              <Table
                columns={[
                  {
                    id: 'workerAddress',
                    label: 'Worker Address',
                    render: ({ workerAddress }) => (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {workerAddress}
                        <IconButton color="primary" sx={{ ml: 3 }}>
                          <CopyLinkIcon />
                        </IconButton>
                      </Box>
                    ),
                  },
                  { id: 'solution', label: 'Fortune' },
                  {
                    id: 'error',
                    label: 'Status',
                    render: ({ error }) => (error ? 'Refused' : 'Accepted'),
                  },
                  { id: 'error', label: 'Refused reason' },
                ]}
                data={data}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            )}
            {data.manifest.requestType !== 'fortune' && (
              <Box
                sx={{
                  borderRadius: '16px',
                  background: '#fff',
                  boxShadow:
                    '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
                  p: '14px 42px 18px',
                }}
              >
                <Stack direction="row" spacing={3} alignItems="center">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ minWidth: 130 }}
                  >
                    URL :
                  </Typography>
                  <Typography
                    variant="body2"
                    color="primary"
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {data.results as string}
                  </Typography>
                  <LoadingButton
                    variant="contained"
                    loading={isDownloadingResults}
                    onClick={handleDownloadDecryptedResultClick}
                  >
                    Download
                  </LoadingButton>
                </Stack>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
