import { useModal } from '@/shared/contexts/modal-context';
import { useUiConfig } from '@/shared/providers/ui-config-provider';
import { AvailableJobsFilterModal } from '../available-jobs-filter-modal';

export function useAvailableJobsFilterModal() {
  const { openModal, closeModal } = useModal();
  const { uiConfig } = useUiConfig();

  return {
    openModal: () => {
      openModal({
        content: (
          <AvailableJobsFilterModal
            chainIdsEnabled={uiConfig?.chainIdsEnabled ?? []}
            close={closeModal}
          />
        ),
      });
    },
  };
}
