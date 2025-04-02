import { useState } from 'react';

export enum ModalRequestStatus {
  Idle,
  Loading,
  Success,
  Error,
}

export const useModalRequestStatus = () => {
  const [modalRequestStatus, setModalRequestStatus] =
    useState<ModalRequestStatus>(ModalRequestStatus.Idle);

  const changeStatus = (status: ModalRequestStatus) =>
    setModalRequestStatus(status);

  const isIdle = modalRequestStatus === ModalRequestStatus.Idle;
  const isLoading = modalRequestStatus === ModalRequestStatus.Loading;
  const isSuccess = modalRequestStatus === ModalRequestStatus.Success;
  const isError = modalRequestStatus === ModalRequestStatus.Error;

  return {
    status: modalRequestStatus,
    changeStatus,
    isIdle,
    isLoading,
    isSuccess,
    isError,
  };
};
