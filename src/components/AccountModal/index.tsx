import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceEventName } from '@uniswap/analytics-events'
import { ScrollBarStyles } from 'components/Common'
import { useWindowSize } from 'hooks/useWindowSize'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useCallback, useEffect, useRef } from 'react'
import { ChevronsRight } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { BREAKPOINTS, ClickableStyle } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

import DefaultMenu from './DefaultMenu'
import { useWeb3React } from '@web3-react/core'
import WalletModal from 'components/WalletModal2'
import AuthenticatedHeader from './AuthenticatedHeader'
import { useAppDispatch } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import WalletInfoModal from 'components/WalletModal2/Info'
import { useIsMobile } from 'nft/hooks'
import { NavDropdown } from 'components/NavBar/NavDropdown'
import { Portal } from 'nft/components/common/Portal'

const DRAWER_WIDTH_XL = '390px'
const DRAWER_WIDTH = '320px'
const DRAWER_MARGIN = '8px'
const DRAWER_OFFSET = '10px'
const DRAWER_TOP_MARGIN_MOBILE_WEB = '72px'

const accountDrawerOpenAtom = atom(false)

export function useToggleAccountDrawer() {
  const updateAccountDrawerOpen = useUpdateAtom(accountDrawerOpenAtom)
  return useCallback(() => {
    updateAccountDrawerOpen((open) => !open)
  }, [updateAccountDrawerOpen])
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

  opacity: 1;
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
  border-radius: 12px;
`

const Container = styled.div<{ open: boolean }>`
  display: ${({ open }) => open ? 'flex' : 'none'};
  flex-direction: row;
  // height: calc(100% - 2 * ${DRAWER_MARGIN});
  overflow: hidden;
  position: fixed;
  // right: ${DRAWER_MARGIN};
  // top: ${DRAWER_MARGIN};
  width: 100%;
  height: 100%;
  // left: 50%;
  // top: 50%;
  // transform: translate(-50%, -50%);
  left: 0;
  top: 0;
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
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  // height: 100%;
  overflow: hidden;
  z-index: ${Z_INDEX.modalBackdrop + 1};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    z-index: ${Z_INDEX.modal};
    position: absolute;
    margin-right: 0;
    top: ${({ open }) => (open ? `calc(-1 * (100% - ${DRAWER_TOP_MARGIN_MOBILE_WEB}))` : 0)};

    width: 100%;
    border-bottom-right-radius: 0px;
    border-bottom-left-radius: 0px;
    box-shadow: unset;
    transition: top ${({ theme }) => theme.transition.duration.medium};
  }

  @media screen and (min-width: 1440px) {
    margin-right: ${({ open }) => (open ? 0 : `-${DRAWER_WIDTH_XL}`)};
    width: ${DRAWER_WIDTH_XL};
  }

  // width: ${DRAWER_WIDTH};
  width: 450px;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  background-color: ${({ theme }) => theme.toast2};

  box-shadow: ${({ theme }) => theme.deepShadow};
  transition: margin-right ${({ theme }) => theme.transition.duration.medium};
`

const CloseIcon = styled(ChevronsRight).attrs({ size: 24 })`
  stroke: ${({ theme }) => theme.textSecondary};
`

const CloseDrawer = styled.div`
  ${ClickableStyle}
  cursor: pointer;
  height: 100%;
  // When the drawer is not hovered, the icon should be 18px from the edge of the sidebar.
  padding: 24px calc(18px + ${DRAWER_OFFSET}) 24px 14px;
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
  const { account } = useWeb3React()
  const [walletDrawerOpen, toggleWalletDrawer] = useAccountDrawer()
  const isMobile = useIsMobile();
  const theme = useTheme();
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

  if (isMobile && walletDrawerOpen) {
    return (
      <Portal>
      <NavDropdown padding='24'>
        {/* id used for child InfiniteScrolls to reference when it has reached the bottom of the component */}
        <AccountDrawerScrollWrapper ref={scrollRef} id="wallet-dropdown-scroll-wrapper">
          {
            account ? (
              <WalletInfoModal isMobile={isMobile} closeModal={toggleWalletDrawer} />
            ) : (
              <WalletModal isMobile={isMobile} closeModal={toggleWalletDrawer} />
            )
          }
        </AccountDrawerScrollWrapper>
      </NavDropdown>
      </Portal>
    )
  }

  return (
    <Container open={walletDrawerOpen}>
      <Scrim onClick={toggleWalletDrawer} open={walletDrawerOpen} />
      <AccountDrawerWrapper open={walletDrawerOpen}>
        {/* id used for child InfiniteScrolls to reference when it has reached the bottom of the component */}
        <AccountDrawerScrollWrapper ref={scrollRef} id="wallet-dropdown-scroll-wrapper">
          {
            account ? (
              <WalletInfoModal closeModal={toggleWalletDrawer} />
            ) : (
              <WalletModal closeModal={toggleWalletDrawer} />
            )
          }
        </AccountDrawerScrollWrapper>
      </AccountDrawerWrapper>
    </Container>
  )
}

export default AccountDrawer