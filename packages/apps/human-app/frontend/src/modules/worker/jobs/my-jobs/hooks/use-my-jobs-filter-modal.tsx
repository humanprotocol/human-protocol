import { useModal } from '@/shared/contexts/modal-context';
import { useGetUiConfig } from '../../hooks';
import { MyJobsFilterModal } from '../components/mobile/my-jobs-filter-modal';

export function useMyJobFilterModal() {
  const { openModal, closeModal } = useModal();
  const { data: uiConfigData } = useGetUiConfig();

  return {
    openModal: () => {
      openModal({
        content: (
          <MyJobsFilterModal
            chainIdsEnabled={uiConfigData?.chainIdsEnabled ?? []}
            close={closeModal}
          />
        ),
      });
    },
  };
}
