import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithWrapper } from '@/shared/test-utils/render-with-wrapper';
import * as useModalStoreModule from '@/components/ui/modal/modal.store';
import { DisplayModal } from './display-modal';
import { MODAL_STATE } from './modal.store';

describe('Display modal contents', () => {
	it('Render example modal', () => {
		vi.spyOn(useModalStoreModule, 'useModalStore').mockImplementation(() => {
			return {
				isModalOpen: true,
				modalState: MODAL_STATE.EXAMPLE_MODAL,
			};
		});
		//ARRANGE
		const { getByTestId } = renderWithWrapper(<DisplayModal />);
		//ACT
		const exampleModalDetails = getByTestId('example-modal');
		//EXPECT
		expect(exampleModalDetails).toBeInTheDocument();
	});

	it('close example modal', () => {
		const mockedCloseModal = vi.fn();
		vi.spyOn(useModalStoreModule, 'useModalStore').mockImplementation(() => {
			return {
				isModalOpen: true,
				modalState: MODAL_STATE.EXAMPLE_MODAL,
				closeModal: mockedCloseModal,
			};
		});

		//ARRANGE
		const { getByTestId } = renderWithWrapper(<DisplayModal />);
		const closeButton = getByTestId('button-close-modal');

		//ACT
		fireEvent.click(closeButton);

		//EXPECT
		expect(mockedCloseModal).toHaveBeenCalledTimes(1);
	});
});
