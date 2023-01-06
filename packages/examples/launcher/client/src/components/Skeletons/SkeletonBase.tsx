import * as React from 'react';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

export const SkeletonBase: React.FC = (): React.ReactElement => {
  return (
    <>
      <Stack spacing={1}>
        <Skeleton
          variant="text"
          width={430}
          height={20}
          animation="wave"
          style={{ marginBottom: 10 }}
        />
        <Skeleton
          variant="text"
          width={430}
          height={20}
          animation="wave"
          style={{ marginBottom: 10 }}
        />
        <Skeleton
          variant="text"
          width={430}
          height={20}
          animation="wave"
          style={{ marginBottom: 10 }}
        />
        <Skeleton
          variant="rectangular"
          width={430}
          height={120}
          animation="wave"
          style={{ marginBottom: 10 }}
        />

        <Skeleton
          variant="text"
          width={430}
          height={20}
          animation="wave"
          style={{ marginBottom: 10 }}
        />
        <Skeleton
          variant="text"
          width={430}
          height={20}
          animation="wave"
          style={{ marginBottom: 10 }}
        />
        <Skeleton
          variant="text"
          width={430}
          height={20}
          animation="wave"
          style={{ marginBottom: 10 }}
        />
        <Skeleton
          variant="rectangular"
          width={430}
          height={120}
          animation="wave"
          style={{ marginBottom: 10 }}
        />

        <Skeleton
          variant="text"
          width={430}
          height={20}
          animation="wave"
          style={{ marginBottom: 10 }}
        />
        <Skeleton
          variant="text"
          width={430}
          height={20}
          animation="wave"
          style={{ marginBottom: 10 }}
        />
        <Skeleton
          variant="text"
          width={430}
          height={20}
          animation="wave"
          style={{ marginBottom: 10 }}
        />
        <Skeleton
          variant="rectangular"
          width={430}
          height={120}
          animation="wave"
          style={{ marginBottom: 10 }}
        />
      </Stack>
    </>
  );
};
