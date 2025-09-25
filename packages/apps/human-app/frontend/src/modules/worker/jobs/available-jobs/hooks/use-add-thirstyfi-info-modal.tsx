/* eslint-disable camelcase -- ...*/
import { useModal } from '@/shared/contexts/modal-context';
import { ThirstyfiInfoModal } from '../thirstyfi-info-modal';

interface AddThirstyfiInfoModalProps {
  escrow_address: string;
  chain_id: number;
}

export function useAddThirstyfiInfoModal() {
  const { openModal } = useModal();

  return {
    openModal: ({ escrow_address, chain_id }: AddThirstyfiInfoModalProps) => {
      openModal({
        content: (
          <ThirstyfiInfoModal
            escrow_address={escrow_address}
            chain_id={chain_id}
          />
        ),
      });
    },
  };
}
