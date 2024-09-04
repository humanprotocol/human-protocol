import { useTranslation } from 'react-i18next';
import type { CustomButtonProps } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { useWalletConnect } from '@/hooks/use-wallet-connect';

export function ConnectWalletBtn(props: CustomButtonProps) {
  const { openModal, isConnected } = useWalletConnect();
  const { t } = useTranslation();
  const defaultStatus = isConnected
    ? t('components.wallet.connectBtn.disconnect')
    : t('components.wallet.connectBtn.connect');
  const btnContent = props.children ? props.children : defaultStatus;

  return (
    <Button
      {...props}
      onClick={() => {
        return void openModal();
      }}
      variant="contained"
    >
      {btnContent}
    </Button>
  );
}
