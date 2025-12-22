import { useModal } from '@/shared/contexts/modal-context';
import { MyJobsFilterModal } from '../components/mobile/my-jobs-filter-modal';
import { useUiConfig } from '@/shared/providers/ui-config-provider';

export function useMyJobFilterModal() {
  const { openModal, closeModal } = useModal();
  const { uiConfig } = useUiConfig();

  return {
    openModal: () => {
      openModal({
        content: (
          <MyJobsFilterModal
            chainIdsEnabled={uiConfig?.chainIdsEnabled ?? []}
            close={closeModal}
          />
        ),
      });
    },
  };
}
