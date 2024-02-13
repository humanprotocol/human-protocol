import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { AppState } from '../types'
import { addPopup, ApplicationModal, PopupContent, setOpenModal } from './reducer'

export function useModalIsOpen(modal: ApplicationModal): boolean {
  const openModal = useAppSelector((state: AppState) => state.application.openModal)
  return openModal === modal
}

/** @ref https://dashboard.moonpay.com/api_reference/client_side_api#ip_addresses */

function useToggleModal(modal: ApplicationModal): () => void {
  const isOpen = useModalIsOpen(modal)
  const dispatch = useAppDispatch()
  return useCallback(() => dispatch(setOpenModal(isOpen ? null : modal)), [dispatch, modal, isOpen])
}

export function useCloseModal(): () => void {
  const dispatch = useAppDispatch()
  return useCallback(() => dispatch(setOpenModal(null)), [dispatch])
}

export function useToggleDelegateModal(): () => void {
  return useToggleModal(ApplicationModal.DELEGATE)
}

export function useToggleVoteModal(): () => void {
  return useToggleModal(ApplicationModal.VOTE)
}

export function useToggleQueueModal(): () => void {
  return useToggleModal(ApplicationModal.QUEUE)
}

export function useToggleRequestCollectionsModal(): () => void {
  return useToggleModal(ApplicationModal.REQUEST_COLLECTIONS)
}

export function useToggleExecuteModal(): () => void {
  return useToggleModal(ApplicationModal.EXECUTE)
}

export function useDepositHMTModal(): () => void {
  return useToggleModal(ApplicationModal.DEPOSIT_HMT)
}

export function useDepositVHMTModal(): () => void {
  return useToggleModal(ApplicationModal.DEPOSIT_VHMT)
}

// returns a function that allows adding a popup
export function useAddPopup(): (content: PopupContent, key?: string, removeAfterMs?: number) => void {
  const dispatch = useAppDispatch()

  return useCallback(
    (content: PopupContent, key?: string, removeAfterMs?: number) => {
      dispatch(addPopup({ content, key, removeAfterMs: removeAfterMs ?? DEFAULT_TXN_DISMISS_MS }))
    },
    [dispatch]
  )
}
