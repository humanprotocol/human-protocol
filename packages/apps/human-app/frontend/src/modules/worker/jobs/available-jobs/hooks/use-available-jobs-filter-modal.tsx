import { useModal } from '@/shared/contexts/modal-context';
import { useGetUiConfig } from '@/shared/hooks';
import { AvailableJobsFilterModal } from '../available-jobs-filter-modal';

export function useAvailableJobsFilterModal() {
  const { openModal, closeModal } = useModal();
  const { data: uiConfigData } = useGetUiConfig();

  return {
    openModal: () => {
      openModal({
        content: (
          <AvailableJobsFilterModal
            chainIdsEnabled={uiConfigData?.chainIdsEnabled ?? []}
            close={closeModal}
          />
        ),
      });
    },
  };
}
