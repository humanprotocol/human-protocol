import * as React from 'react';
import { Box, Typography } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { CardTextBlock } from '../Cards';
import Events from './Events';

interface IEscrow {
  title: string;
  address: string;
  eventsUrl: string;
  scanner: string;
  scannerUrl?: string;
  latestEscrow?: string;
  count?: number;
  pendingEventCount?: number;
  bulkTransferEventCount?: number;
  intermediateStorageEventCount?: number;
  totalEventCount?: number;
}

export const EscrowFactoryView: React.FC<IEscrow> = ({
  title,
  count,
  address,
  latestEscrow,
  eventsUrl,
  scanner,
  pendingEventCount,
  bulkTransferEventCount,
  intermediateStorageEventCount,
  totalEventCount,
}): React.ReactElement => {
  return (
    <Box>
      <Typography>{title}</Typography>
      <Card variant="outlined">
        <CardContent>
          <CardTextBlock title="Address" value={address} />
          <CardTextBlock title="Latest Escrow" value={latestEscrow} />
          <CardTextBlock title="Amount of jobs" value={count} />
          <CardTextBlock
            title="All Escrows Pending Events"
            value={pendingEventCount}
          />
          <CardTextBlock
            title="All Escrows BulkTransfer Events"
            value={bulkTransferEventCount}
          />
          <CardTextBlock
            title="All Escrows IntermediateStorage Events"
            value={intermediateStorageEventCount}
          />
          <CardTextBlock
            title="Total Number Of Escrows Events"
            value={totalEventCount}
          />
          <Events url={eventsUrl} scanner={scanner} />
        </CardContent>
      </Card>
    </Box>
  );
};
