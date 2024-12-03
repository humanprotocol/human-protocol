import { describe, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithWrapper } from '@/shared/test-utils/render-with-wrapper';
import { ModalHeader } from '@/components/ui/modal/modal-header';

const mockedCloseProcessModal = vi.fn();

const closeButtonProps = {
  closeButton: {
    isVisible: true,
    onClick: mockedCloseProcessModal,
  },
};

describe('Modal header', () => {
  it('is close button visible', () => {
    const { getByTestId } = renderWithWrapper(
      <ModalHeader {...closeButtonProps} />
    );
    const closeButton = getByTestId('button-close-modal');
    expect(closeButton).toBeVisible();
  });

  it('is close button not visible', () => {
    const { queryByTestId } = renderWithWrapper(<ModalHeader />);
    const closeModal = queryByTestId('button-close-modal');
    expect(closeModal).toBeNull();
  });

  it('is breadcrumb not visible', () => {
    const { queryByTestId } = renderWithWrapper(<ModalHeader />);
    const breadcrumb = queryByTestId('breadcrumb-button');
    expect(breadcrumb).toBeNull();
  });

  it('close modal', () => {
    //ARRANGE
    const { getByTestId } = renderWithWrapper(
      <ModalHeader {...closeButtonProps} />
    );
    //ACT
    const button = getByTestId('button-close-modal');
    expect(button).toBeVisible();
    //EXPECT
    fireEvent.click(button);
    expect(mockedCloseProcessModal).toBeCalledTimes(1);
  });
});
