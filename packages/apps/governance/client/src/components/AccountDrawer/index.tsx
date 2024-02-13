import { ScrollBarStyles } from 'components/Common'
import GrayCloseButton from 'components/GrayCloseButton/GrayCloseButton'
import { useWindowSize } from 'hooks/useWindowSize'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { CloseDrawerIcon } from 'nft/components/icons'
import { useCallback, useEffect, useRef } from 'react'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ClickableStyle } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

import DefaultMenu from './DefaultMenu'

const DRAWER_WIDTH_XL = '390px'
const DRAWER_WIDTH = '320px'
const DRAWER_MARGIN = '0px'
const DRAWER_TOP_MARGIN_MOBILE_WEB = '72px'

const accountDrawerOpenAtom = atom(false)

export function useToggleAccountDrawer() {
  const updateAccountDrawerOpen = useUpdateAtom(accountDrawerOpenAtom)
  return useCallback(() => {
    updateAccountDrawerOpen((open) => !open)
  }, [updateAccountDrawerOpen])
}

export function useCloseAccountDrawer() {
  const updateAccountDrawerOpen = useUpdateAtom(accountDrawerOpenAtom)
  return useCallback(() => updateAccountDrawerOpen(false), [updateAccountDrawerOpen])
}

export function useAccountDrawer(): [boolean, () => void] {
  const accountDrawerOpen = useAtomValue(accountDrawerOpenAtom)
  return [accountDrawerOpen, useToggleAccountDrawer()]
}

const ScrimBackground = styled.div<{ open: boolean }>`
  z-index: ${Z_INDEX.modalBackdrop};
  overflow: hidden;
  top: 0;
  left: 0;
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.backgroundScrim};

  opacity: 0;
  pointer-events: none;
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    opacity: ${({ open }) => (open ? 1 : 0)};
    pointer-events: ${({ open }) => (open ? 'auto' : 'none')};
    transition: opacity ${({ theme }) => theme.transition.duration.medium} ease-in-out;
  }
`
const Scrim = ({ onClick, open }: { onClick: () => void; open: boolean }) => {
  const { width } = useWindowSize()

  useEffect(() => {
    if (width && width < BREAKPOINTS.sm && open) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'visible'
    }
  }, [open, width])

  return <ScrimBackground onClick={onClick} open={open} />
}

const AccountDrawerScrollWrapper = styled.div`
  overflow: hidden;
  &:hover {
    overflow-y: auto;
  }

  ${ScrollBarStyles}

  scrollbar-gutter: stable;
  overscroll-behavior: contain;
`

const Container = styled.div`
  height: 100%;
  position: fixed;
  right: 2.5px;
  top: ${DRAWER_MARGIN};
  display: flex;
  flex-direction: row;
  overflow: hidden;
  z-index: ${Z_INDEX.fixed};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    top: 100%;
    left: 0;
    right: 0;
    width: 100%;
    overflow: visible;
  }
`

const AccountDrawerWrapper = styled.div<{ open: boolean }>`
  margin-right: ${({ open }) => (open ? 0 : '-' + DRAWER_WIDTH)};
  height: 100%;
  overflow: hidden;
  box-shadow: 0px 6px 30px 5px rgba(233, 235, 250, 0.52), 0px 16px 24px 2px rgba(233, 235, 250, 0.44),
    0px 8px 10px -5px rgba(233, 235, 250, 0.3);
  border-radius: 16px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    width: 100%;
    position: absolute;
    top: ${({ open }) => (open ? `calc(-1 * (100% - ${DRAWER_TOP_MARGIN_MOBILE_WEB}))` : 0)};
    margin-right: 0;
    z-index: ${Z_INDEX.modal};
    border-radius: 16px;
    border-bottom-right-radius: 0px;
    border-bottom-left-radius: 0px;
    box-shadow: unset;
    transition: top ${({ theme }) => theme.transition.duration.medium};
  }

  @media screen and (min-width: 1440px) {
    width: ${DRAWER_WIDTH_XL};
    margin-right: ${({ open }) => (open ? 0 : `-${DRAWER_WIDTH_XL}`)};
  }

  width: ${DRAWER_WIDTH};
  border-radius: 0px;
  font-size: 16px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  box-shadow: ${({ theme }) => theme.deepShadow};
  transition: margin-right ${({ theme }) => theme.transition.duration.medium};

  > button {
    margin-top: 16px;
  }
`

const CloseDrawer = styled.div`
  ${ClickableStyle}
  cursor: pointer;
  height: 72px;
  padding: 24px;
  border-radius: 20px 0 0 20px;
  transition: ${({ theme }) =>
    `${theme.transition.duration.medium} ${theme.transition.timing.ease} background-color, ${theme.transition.duration.medium} ${theme.transition.timing.ease} margin`};
  &:hover {
    z-index: -1;
    margin: 0 -8px 0 0;
    background-color: ${({ theme }) => theme.stateOverlayHover};
  }
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    display: none;
  }
`

function AccountDrawer() {
  const [walletDrawerOpen, toggleWalletDrawer] = useAccountDrawer()

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!walletDrawerOpen) {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [walletDrawerOpen])

  // close on escape keypress
  useEffect(() => {
    const escapeKeyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && walletDrawerOpen) {
        event.preventDefault()
        toggleWalletDrawer()
      }
    }

    document.addEventListener('keydown', escapeKeyDownHandler)

    return () => {
      document.removeEventListener('keydown', escapeKeyDownHandler)
    }
  }, [walletDrawerOpen, toggleWalletDrawer])

  return (
    <Container>
      {walletDrawerOpen && (
        <CloseDrawer onClick={toggleWalletDrawer}>
          <CloseDrawerIcon />
        </CloseDrawer>
      )}
      <Scrim onClick={toggleWalletDrawer} open={walletDrawerOpen} />
      <AccountDrawerWrapper open={walletDrawerOpen}>
        <GrayCloseButton onClick={toggleWalletDrawer} />
        {/* id used for child InfiniteScrolls to reference when it has reached the bottom of the component */}
        <AccountDrawerScrollWrapper ref={scrollRef} id="wallet-dropdown-scroll-wrapper">
          <DefaultMenu />
        </AccountDrawerScrollWrapper>
      </AccountDrawerWrapper>
    </Container>
  )
}

export default AccountDrawer
