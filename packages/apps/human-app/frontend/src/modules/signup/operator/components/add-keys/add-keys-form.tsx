import { Grid } from '@mui/material';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { Button } from '@/shared/components/ui/button';
import { type GetEthKVStoreValuesSuccessResponse } from '@/modules/operator/hooks';
import { ExistingKeysForm } from './existing-keys-form';
import { PendingKeysForm } from './pending-keys-form';

export function AddKeysForm({
  keysData,
}: Readonly<{
  keysData: GetEthKVStoreValuesSuccessResponse;
}>) {
  const hasSomeNotEmptyKeys = Object.values(keysData).some(Boolean);
  const hasSomePendingKeys = Object.values(keysData).some((value) => {
    /**
     * This check is necessary because TS can't infer
     * "undefined" from optional object's property
     */
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (value === undefined) {
      return false;
    }

    return value.length === 0;
  });

  return (
    <Grid container gap="2rem">
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '3rem',
        }}
      >
        {hasSomeNotEmptyKeys ? <ExistingKeysForm keysData={keysData} /> : null}
        {hasSomePendingKeys ? <PendingKeysForm keysData={keysData} /> : null}
        {hasSomeNotEmptyKeys && !hasSomePendingKeys ? (
          <Button
            component={Link}
            to={routerPaths.operator.editExistingKeysSuccess}
            variant="contained"
          >
            {t('operator.addKeysPage.skipBtn')}
          </Button>
        ) : null}
      </div>
    </Grid>
  );
}
