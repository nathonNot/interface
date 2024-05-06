import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
// import PortfolioDrawer, { useAccountDrawer } from 'components/AccountDrawer'
import PortfolioDrawer, { useAccountDrawer } from 'components/AccountModal'
import PrefetchBalancesWrapper from 'components/AccountDrawer/PrefetchBalancesWrapper'
import Loader from 'components/Icons/LoadingSpinner'
import { IconWrapper } from 'components/Identicon/StatusIcon'
import { useGetConnection } from 'connection'
import { Portal } from 'nft/components/common/Portal'
import { useIsNftClaimAvailable } from 'nft/hooks/useIsNftClaimAvailable'
import { darken } from 'polished'
import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import styled from 'styled-components/macro'
import { colors } from 'theme/colors'
import { flexRowNoWrap } from 'theme/styles'

import { isTransactionRecent, useAllTransactions } from '../../state/transactions/hooks'
import { TransactionDetails } from '../../state/transactions/types'
import { shortenAddress } from '../../utils'
import { ButtonSecondary } from '../Button'
import StatusIcon from '../Identicon/StatusIcon'
import { RowBetween } from '../Row'
import { WalletLogo } from 'components/Icons/Wallet'
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { updateSelectedWallet } from 'state/user/reducer'
import { useIsMobile } from 'nft/hooks'

// https://stackoverflow.com/a/31617326
const FULL_BORDER_RADIUS = 9999

const Web3StatusGeneric = styled(ButtonSecondary)`
  ${flexRowNoWrap};
  width: 100%;
  align-items: center;
  padding: 0.5rem;
  border-radius: ${FULL_BORDER_RADIUS}px;
  cursor: pointer;
  user-select: none;
  // height: 36px;
  margin-right: 2px;
  margin-left: 2px;
  :focus {
    outline: none;
  }
`
const Web3StatusError = styled(Web3StatusGeneric)`
  background-color: ${({ theme }) => theme.accentFailure};
  border: 1px solid ${({ theme }) => theme.accentFailure};
  color: ${({ theme }) => theme.white};
  font-weight: 500;
  :hover,
  :focus {
    background-color: ${({ theme }) => darken(0.1, theme.accentFailure)};
  }
`

const Web3StatusConnectWrapper = styled.div<{ faded?: boolean; isMobile: boolean; }>`
  ${flexRowNoWrap};
  align-items: center;
  background-color: ${({ theme }) => theme.accentActionSoft};
  border-radius: ${FULL_BORDER_RADIUS}px;

  
  border: none;
  padding: 0;
  // height: 40px;

  color: ${({ theme }) => theme.accentAction};

  border-radius: ${({ isMobile }) => isMobile ? 8 : 16}px;
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.white};
  // :hover {
  //   color: ${({ theme }) => theme.accentActionSoft};
  //   stroke: ${({ theme }) => theme.accentActionSoft};
  // }

  transition: ${({
  theme: {
    transition: { duration, timing },
  },
}) => `${duration.fast} color ${timing.in}`};
`

const Web3StatusConnected = styled(Web3StatusGeneric) <{
  pending?: boolean
  isClaimAvailable?: boolean
}>`
  width: 228px;
  background-color: ${({ pending, theme }) => (pending ? theme.accentAction : theme.primary)};
  border: 1px solid ${({ pending, theme }) => (pending ? theme.accentAction : theme.opacify)};
  color: ${({ pending, theme }) => (pending ? theme.white : theme.textPrimary)};
  font-weight: 500;
  border: ${({ isClaimAvailable }) => isClaimAvailable && `1px solid ${colors.purple300}`};
  border-radius: 18px;
  padding: 12px 24px;
  :hover,
  :focus {
    border: 1px solid ${({ theme }) => darken(0.05, theme.deprecated_bg3)};

    :focus {
      border: 1px solid
        ${({ pending, theme }) =>
    pending ? darken(0.1, theme.accentAction) : darken(0.1, theme.backgroundInteractive)};
    }
  }

  // @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
  //   width: ${({ pending }) => !pending && '36px'};

  //   ${IconWrapper} {
  //     margin-right: 0;
  //   }
  // }
`

const AddressAndChevronContainer = styled.div`
  display: flex;

  align-items: center;
  gap: 10px;


  // @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.navSearchInputVisible}px`}) {
  //   display: none;
  // }
`

const Text = styled.p`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0.5rem 0 0.25rem;
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
`

const NetworkIcon = styled(AlertTriangle)`
  margin-left: 0.25rem;
  margin-right: 0.5rem;
  width: 16px;
  height: 16px;
`

// we want the latest one to come first, so return negative if a is after b
function newTransactionsFirst(a: TransactionDetails, b: TransactionDetails) {
  return b.addedTime - a.addedTime
}

const StyledConnectButton = styled.button<{ isMobile: boolean }>`
  background-color: transparent;
  border: none;
  // border-top-left-radius: ${FULL_BORDER_RADIUS}px;
  // border-bottom-left-radius: ${FULL_BORDER_RADIUS}px;
  cursor: pointer;
  font-weight: 500;
  font-size: 16px;
  padding: ${({ isMobile }) => isMobile ? '6px 12px' : '12px 24px'};
  color: inherit;

  display: flex;
  align-items: center;
  gap: 10px;

  
`

const WalletMenu = styled.div`
  background: ${({ theme }) => theme.toast2};
  padding: 12px;
  border-radius: 8px;
  position: absolute;
  width: 228px;
`

const Title = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #8E8E8E;
  margin-bottom: 12px;
`

const Option = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #F4F4F4;
  font-size: 16px;
  font-weight: 500;
  padding: 8px;
  gap: 8px;

  &:not(:last-child) {
    marign-bottom: 8px;
  }

  &:hover {
    background: #262449;
  }
`

function Web3StatusInner() {
  const { account, connector, chainId, ENSName } = useWeb3React()
  const getConnection = useGetConnection()
  const connection = getConnection(connector)
  const dispatch = useAppDispatch()
  const [, toggleAccountDrawer] = useAccountDrawer()
  const handleWalletDropdownClick = useCallback(() => {
    sendAnalyticsEvent(InterfaceEventName.ACCOUNT_DROPDOWN_BUTTON_CLICKED)
    toggleAccountDrawer()
  }, [toggleAccountDrawer])

  const isMobile = useIsMobile()

  const [menuOpen, setMenuOpen] = useState(false);
  const isClaimAvailable = useIsNftClaimAvailable((state) => state.isClaimAvailable)

  const error = useAppSelector((state) => state.connection.errorByConnectionType[getConnection(connector).type])

  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  const pending = sortedRecentTransactions.filter((tx) => !tx.receipt).map((tx) => tx.hash)

  const hasPendingTransactions = !!pending.length

  const disconnect = useCallback(() => {
    if (connector && connector.deactivate) {
      connector.deactivate()
    }
    connector.resetState()
    dispatch(updateSelectedWallet({ wallet: undefined }))
  }, [connector, dispatch])

  if (!chainId) {
    return null
  } else if (error) {
    return (
      <Web3StatusError onClick={handleWalletDropdownClick}>
        <NetworkIcon />
        <Text>
          <Trans>Error</Trans>
        </Text>
      </Web3StatusError>
    )
  } else if (account) {
    return (
      <TraceEvent
        events={[BrowserEvent.onClick]}
        name={InterfaceEventName.MINI_PORTFOLIO_TOGGLED}
        properties={{ type: 'open' }}
      >
        <Web3StatusConnected
          data-testid="web3-status-connected"
          onClick={() => setMenuOpen(true)}
          pending={hasPendingTransactions}
          isClaimAvailable={isClaimAvailable}
        >
          {/* {!hasPendingTransactions && <StatusIcon size={24} connection={connection} showMiniIcons={false} />} */}
          {hasPendingTransactions ? (
            <RowBetween>
              <Text>
                <Trans>{pending?.length} Pending</Trans>
              </Text>{' '}
              <Loader stroke="white" />
            </RowBetween>
          ) : (
            <AddressAndChevronContainer>
              <WalletLogo />
              <Text>{ENSName || shortenAddress(account)}</Text>
            </AddressAndChevronContainer>
          )}
        </Web3StatusConnected>
        {
          menuOpen && (
            <WalletMenu>
              <Title>Menu</Title>
              <Option onClick={handleWalletDropdownClick}><WalletLogo /> Wallet</Option>
              <Option onClick={disconnect}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <g clip-path="url(#clip0_343_5566)">
                    <path d="M7 6C7.26522 6 7.51957 5.89464 7.70711 5.70711C7.89464 5.51957 8 5.26522 8 5C8 4.73478 7.89464 4.48043 7.70711 4.29289C7.51957 4.10536 7.26522 4 7 4H5C4.73478 4 4.48043 4.10536 4.29289 4.29289C4.10536 4.48043 4 4.73478 4 5V19C4 19.2652 4.10536 19.5196 4.29289 19.7071C4.48043 19.8946 4.73478 20 5 20H7C7.26522 20 7.51957 19.8946 7.70711 19.7071C7.89464 19.5196 8 19.2652 8 19C8 18.7348 7.89464 18.4804 7.70711 18.2929C7.51957 18.1054 7.26522 18 7 18H6V6H7Z" fill="white" />
                    <path d="M20.82 11.42L18 7.41995C17.8471 7.20436 17.615 7.05809 17.3545 7.01312C17.0941 6.96815 16.8264 7.02813 16.61 7.17995C16.5018 7.25574 16.4098 7.35219 16.3391 7.46376C16.2684 7.57532 16.2206 7.69977 16.1982 7.82994C16.1759 7.9601 16.1796 8.09339 16.2091 8.22212C16.2386 8.35085 16.2933 8.47247 16.37 8.57995L18.09 11H10C9.73478 11 9.48043 11.1053 9.29289 11.2928C9.10536 11.4804 9 11.7347 9 12C9 12.2652 9.10536 12.5195 9.29289 12.7071C9.48043 12.8946 9.73478 13 10 13H18L16.2 15.4C16.1212 15.505 16.0639 15.6246 16.0313 15.7518C15.9987 15.879 15.9915 16.0114 16.01 16.1414C16.0286 16.2714 16.0726 16.3964 16.1395 16.5094C16.2064 16.6224 16.2949 16.7212 16.4 16.7999C16.5731 16.9298 16.7836 17 17 17C17.1552 17 17.3084 16.9638 17.4472 16.8944C17.5861 16.8249 17.7069 16.7241 17.8 16.6L20.8 12.6C20.9281 12.4308 20.999 12.2253 21.0026 12.0132C21.0062 11.8011 20.9423 11.5933 20.82 11.42Z" fill="white" />
                  </g>
                  <defs>
                    <clipPath id="clip0_343_5566">
                      <rect width="24" height="24" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                Disconnect
              </Option>
            </WalletMenu>
          )
        }
      </TraceEvent>
    )
  } else {
    return (
      <TraceEvent
        events={[BrowserEvent.onClick]}
        name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
        element={InterfaceElementName.CONNECT_WALLET_BUTTON}
      >
        <Web3StatusConnectWrapper
          tabIndex={0}
          faded={!account}
          onKeyPress={(e) => e.key === 'Enter' && handleWalletDropdownClick()}
          onClick={handleWalletDropdownClick}
          isMobile={isMobile}
        >
          <StyledConnectButton isMobile={isMobile} tabIndex={-1} data-testid="navbar-connect-wallet">
            {
              isMobile ? (
                <Trans>Connect</Trans>
              ) : (
                <>
                  <WalletLogo />
                  <Trans>Connect Wallet</Trans>
                </>
              )
            }
          </StyledConnectButton>
        </Web3StatusConnectWrapper>
      </TraceEvent>
    )
  }
}

export default function Web3Status() {
  return (
    <PrefetchBalancesWrapper>
      <Web3StatusInner />
      <Portal>
        <PortfolioDrawer />
      </Portal>
    </PrefetchBalancesWrapper>
  )
}
