import { Button } from '@mui/material';
import React from 'react';

export const jobListColumns = [
  { title: 'Id', dataIndex: 'id' },
  { title: 'Network', dataIndex: 'networkId' },
  { title: 'Balance', dataIndex: 'price' },
  { title: 'Address', dataIndex: 'tokenAddress' },
  { title: 'URL', dataIndex: 'dataUrl' },
  {
    title: 'Action',
    dataIndex: 'action',
    render: (row: any) => (
      <Button
        id={row.id}
        variant="outlined"
        onClick={(e) => e.stopPropagation()}
      >
        Cancel
      </Button>
    ),
  },
];

export const jobDetailsColumns = [
  { title: 'Item', dataIndex: 'prop' },
  { title: 'Value', dataIndex: 'value' },
];

export enum ValueName {
  LocalGanache = 'Local Ganache',
  Batch = 'Batch',
  ImageLabel = 'Image Label Binary',
  Paid = 'Paid',
  Launched = 'Launched',
}
