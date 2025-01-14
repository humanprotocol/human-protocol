import { t } from 'i18next';
import { Button } from '@/shared/components/ui/button';

export function ProfileEnableButton() {
  // TODO add operator activation
  return (
    <Button disabled variant="contained">
      {t('operator.profile.activateBtn')}
    </Button>
  );
}
