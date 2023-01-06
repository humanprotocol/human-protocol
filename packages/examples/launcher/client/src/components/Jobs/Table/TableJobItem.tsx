/* eslint-disable camelcase */
import * as React from 'react';
import Box from '@mui/material/Box';
import { useParams } from 'react-router-dom';

import { dateFormat } from '../../../utils';

import { useGetJobByIdQuery } from '../../../services/redux/api/jobApi';
import { BoxContainer } from '../../Grid';
import { Backdrop } from '../../Backdrop';
import { Table } from '../../Table';

import { jobDetailsColumns } from './columns';
import { PROP_MAP, VALUE_MAP } from './constants';

export function TableJobItem() {
  const { id } = useParams();
  const { data, error, isLoading } = useGetJobByIdQuery(id);
  const [open, setOpen] = React.useState(false);
  const handleClose = (value: boolean) => {
    setOpen(value);
  };
  React.useEffect(() => {
    if (isLoading) {
      handleClose(true);
    } else {
      handleClose(false);
    }
  }, [isLoading]);

  const values: any = [];

  if (!isLoading && data) {
    Object.entries(data).map(([prop, value]) => {
      if (
        prop === 'data' ||
        prop === 'userId' ||
        prop === 'requesterQuestionExample' ||
        value === ''
      ) {
        return null;
      }
      if (prop === 'url' || prop === 'createdAt' || prop === 'updatedAt') {
        value = dateFormat(value);
      }
      if (prop === 'dataUrl') {
        const valueData: any = value;
        value = (
          <a target="_blank" href={String(value)} rel="noreferrer">
            {valueData}
          </a>
        );
      }
      if (prop === 'price') {
        const valueData: any = value;
        value = `${valueData} HMT`;
      }
      if (prop === 'labels') {
        const valueData: any = value;
        value = valueData.join(' ');
      }
      return values.push({
        id: prop,
        prop: PROP_MAP[prop],
        value: typeof value === 'string' ? VALUE_MAP[value] ?? value : value,
      });
    });
  }

  return (
    <>
      <BoxContainer>
        <Box sx={{ height: 400, width: '100%' }}>
          {!isLoading && values && (
            <Table columns={jobDetailsColumns} data={values} />
          )}
          {error && <div>error</div>}
        </Box>
      </BoxContainer>
      <Backdrop open={open} handleClose={handleClose} />
    </>
  );
}
