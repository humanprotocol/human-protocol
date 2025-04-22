import { useModal } from '@/shared/contexts/modal-context';
import { AvailableJobsFilterModal } from '../available-jobs-filter-modal';
import { useGetUiConfig } from '../../hooks';

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
