import { describe, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithWrapper } from '@/shared/test-utils/render-with-wrapper';
import { ModalHeader } from '@/components/ui/modal/modal-header';

const mockedCloseProcessModal = vi.fn();
const mockedBreadcrumbFunction = vi.fn();

const closeButtonProps = {
  closeButton: {
    isVisible: true,
    onClick: mockedCloseProcessModal,
  },
};

const breadcrumbProps = {
  breadcrumb: {
    onClick: mockedBreadcrumbFunction,
    isVisible: true,
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

  it('is breadcrumb visible', () => {
    const { getByTestId } = renderWithWrapper(
      <ModalHeader
        {...breadcrumbProps}
        closeButton={{
          isVisible: false,
          // eslint-disable-next-line @typescript-eslint/no-empty-function -- ...
          onClick: () => {},
        }}
      />
    );
    const breadcrumbButton = getByTestId('breadcrumb-button');
    expect(breadcrumbButton).toBeVisible();
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

  //TODO change this test breadcrumb function later
  it('breadcrumb clicked', () => {
    const { getByTestId } = renderWithWrapper(
      <ModalHeader
        {...breadcrumbProps}
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- ...,
        closeButton={{ isVisible: true, onClick: () => {} }}
      />
    );
    const breadCrumbButton = getByTestId('breadcrumb-button');
    fireEvent.click(breadCrumbButton);
    expect(mockedBreadcrumbFunction).toBeCalledTimes(1);
  });
});
