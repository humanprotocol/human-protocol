import { createSlice, nanoid } from '@reduxjs/toolkit'
import { SupportedChainId } from 'constants/chains'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'

export enum PopupType {
  Transaction = 'transaction',
  Order = 'order',
  FailedSwitchNetwork = 'failedSwitchNetwork',
}

export type PopupContent =
  | {
      txn: {
        hash: string
      }
    }
  | {
      failedSwitchNetwork: SupportedChainId
    }

export enum ApplicationModal {
  ADDRESS_CLAIM,
  BLOCKED_ACCOUNT,
  CLAIM_POPUP,
  DELEGATE,
  EXECUTE,
  FEATURE_FLAGS,
  FIAT_ONRAMP,
  MENU,
  METAMASK_CONNECTION_ERROR,
  NETWORK_FILTER,
  NETWORK_SELECTOR,
  POOL_OVERVIEW_OPTIONS,
  PRIVACY_POLICY,
  QUEUE,
  SELF_CLAIM,
  SETTINGS,
  SHARE,
  TAX_SERVICE,
  TIME_SELECTOR,
  VOTE,
  WALLET,
  UNISWAP_NFT_AIRDROP_CLAIM,
  DEPOSIT_HMT,
  DEPOSIT_VHMT,
  REQUEST_COLLECTIONS,
}

type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>

interface ApplicationState {
  readonly isHubChainActive: boolean
  readonly fiatOnramp: { available: boolean; availabilityChecked: boolean }
  readonly chainId: number | null
  readonly openModal: ApplicationModal | null
  readonly popupList: PopupList
}

const initialState: ApplicationState = {
  isHubChainActive: false,
  fiatOnramp: { available: false, availabilityChecked: false },
  chainId: null,
  openModal: null,
  popupList: [],
}

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    setIsHubChainActive(state, action) {
      const flag = action.payload
      state.isHubChainActive = flag
    },
    updateChainId(state, action) {
      const { chainId } = action.payload
      state.chainId = chainId
    },
    setOpenModal(state, action) {
      state.openModal = action.payload
    },
    addPopup(state, { payload: { content, key, removeAfterMs = DEFAULT_TXN_DISMISS_MS } }) {
      state.popupList = (key ? state.popupList.filter((popup) => popup.key !== key) : state.popupList).concat([
        {
          key: key || nanoid(),
          show: true,
          content,
          removeAfterMs,
        },
      ])
    },
  },
})

export const { setIsHubChainActive, updateChainId, setOpenModal, addPopup } = applicationSlice.actions
export default applicationSlice.reducer
