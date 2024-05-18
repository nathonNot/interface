import { sendAnalyticsEvent, user } from '@uniswap/analytics'
import { CustomUserProperties, InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { getWalletMeta } from '@uniswap/conedison/provider/meta'
import { useWeb3React } from '@web3-react/core'
import { useAccountDrawer } from 'components/AccountDrawer'
import IconButton from 'components/AccountDrawer/IconButton'
import { sendEvent } from 'components/analytics'
import { AutoColumn } from 'components/Column'
import Row, { AutoRow, RowBetween } from 'components/Row'
import { Connection, ConnectionType, getConnections, getShowConnections, networkConnection } from 'connection'
import { useGetConnection } from 'connection'
import { ErrorCode } from 'connection/utils'
import { isSupportedChain } from 'constants/chains'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppDispatch } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import { useConnectedWallets } from 'state/wallets/hooks'
import styled from 'styled-components/macro'
import { CloseIcon, ThemedText } from 'theme'
import { flexColumnNoWrap } from 'theme/styles'

import ConnectionErrorView from './ConnectionErrorView'
import Option from './Option'

const Wrapper = styled.div<{ isMobile: boolean }>`
  ${flexColumnNoWrap};
  width: 100%;
  flex: 1;

  
  padding: ${({ isMobile }) => !isMobile && '24px'};
  border-radius: ${({ isMobile }) => !isMobile && '16px'};
  background: ${({ theme, isMobile }) => !isMobile && theme.toast2};
`

const OptionGrid = styled.div`
  display: grid;
  grid-gap: 12px;
  overflow: hidden;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    grid-template-columns: 1fr;
  `};
`

const PrivacyPolicyWrapper = styled.div`
  padding: 0 4px;
`

const sendAnalyticsEventAndUserInfo = (
  account: string,
  walletType: string,
  chainId: number | undefined,
  isReconnect: boolean,
  peerWalletAgent: string | undefined
) => {
  // User properties *must* be set before sending corresponding event properties,
  // so that the event contains the correct and up-to-date user properties.
  user.set(CustomUserProperties.WALLET_ADDRESS, account)
  user.set(CustomUserProperties.WALLET_TYPE, walletType)
  user.set(CustomUserProperties.PEER_WALLET_AGENT, peerWalletAgent ?? '')
  if (chainId) {
    user.postInsert(CustomUserProperties.ALL_WALLET_CHAIN_IDS, chainId)
  }
  user.postInsert(CustomUserProperties.ALL_WALLET_ADDRESSES_CONNECTED, account)

  sendAnalyticsEvent(InterfaceEventName.WALLET_CONNECT_TXN_COMPLETED, {
    result: WalletConnectionResult.SUCCEEDED,
    wallet_address: account,
    wallet_type: walletType,
    is_reconnect: isReconnect,
    peer_wallet_agent: peerWalletAgent,
  })
}

function didUserReject(connection: Connection, error: any): boolean {
  return (
    error?.code === ErrorCode.USER_REJECTED_REQUEST ||
    (connection.type === ConnectionType.WALLET_CONNECT && error?.toString?.() === ErrorCode.WC_MODAL_CLOSED) ||
    (connection.type === ConnectionType.COINBASE_WALLET && error?.toString?.() === ErrorCode.CB_REJECTED_REQUEST)
  )
}

export default function WalletModal({ closeModal, isMobile = false }: { closeModal: () => void; isMobile?: boolean }) {
  const dispatch = useAppDispatch()
  const { connector, account, chainId, provider } = useWeb3React()
  const [drawerOpen, toggleWalletDrawer] = useAccountDrawer()

  const [connectedWallets, addWalletToConnectedWallets] = useConnectedWallets()
  const [lastActiveWalletAddress, setLastActiveWalletAddress] = useState<string | undefined>(account)
  const [pendingConnection, setPendingConnection] = useState<Connection | undefined>()
  const [pendingError, setPendingError] = useState<any>()

  const connections = getShowConnections()
  const getConnection = useGetConnection()

  useEffect(() => {
    // Clean up errors when the dropdown closes
    return () => setPendingError(undefined)
  }, [setPendingError])

  const openOptions = useCallback(() => {
    if (pendingConnection) {
      setPendingError(undefined)
      setPendingConnection(undefined)
    }
  }, [pendingConnection, setPendingError])

  // Keep the network connector in sync with any active user connector to prevent chain-switching on wallet disconnection.
  useEffect(() => {
    if (chainId && isSupportedChain(chainId) && connector !== networkConnection.connector) {
      networkConnection.connector.activate(chainId)
    }
  }, [chainId, connector])

  // When new wallet is successfully set by the user, trigger logging of Amplitude analytics event.
  useEffect(() => {
    if (account && account !== lastActiveWalletAddress) {
      const walletName = getConnection(connector).getName()
      const peerWalletAgent = provider ? getWalletMeta(provider)?.agent : undefined
      const isReconnect =
        connectedWallets.filter((wallet) => wallet.account === account && wallet.walletType === walletName).length > 0
      sendAnalyticsEventAndUserInfo(account, walletName, chainId, isReconnect, peerWalletAgent)
      if (!isReconnect) addWalletToConnectedWallets({ account, walletType: walletName })
    }
    setLastActiveWalletAddress(account)
  }, [
    connectedWallets,
    addWalletToConnectedWallets,
    lastActiveWalletAddress,
    account,
    connector,
    chainId,
    provider,
    getConnection,
  ])

  // Used to track the state of the drawer in async function
  const drawerOpenRef = useRef(drawerOpen)
  drawerOpenRef.current = drawerOpen

  const tryActivation = useCallback(
    async (connection: Connection) => {
      // Skips wallet connection if the connection should override the default behavior, i.e. install metamask or launch coinbase app
      if (connection.overrideActivate?.()) return

      // log selected wallet
      sendEvent({
        category: 'Wallet',
        action: 'Change Wallet',
        label: connection.type,
      })

      try {
        setPendingConnection(connection)
        setPendingError(undefined)

        await connection.connector.activate()
        console.debug(`connection activated: ${connection.getName()}`)
        dispatch(updateSelectedWallet({ wallet: connection.type }))

        closeModal()
      } catch (error) {
        console.debug(`web3-react connection error: ${JSON.stringify(error)}`)
        // TODO(WEB-3162): re-add special treatment for already-pending injected errors
        if (didUserReject(connection, error)) {
          setPendingConnection(undefined)
        } else {
          setPendingError(error)

          sendAnalyticsEvent(InterfaceEventName.WALLET_CONNECT_TXN_COMPLETED, {
            result: WalletConnectionResult.FAILED,
            wallet_type: connection.getName(),
          })
        }
      }
    },
    [dispatch, setPendingError, toggleWalletDrawer]
  )

  return (
    <Wrapper data-testid="wallet-modal" isMobile={isMobile}>
      <AutoColumn gap='27px'>
        <RowBetween width="100%">
          <ThemedText.SubHeader fontWeight={600} fontSize={24}>Connect a wallet</ThemedText.SubHeader>
          <CloseIcon onClick={closeModal} data-cy="wallet-close" />
        </RowBetween>
        {pendingError ? (
          pendingConnection && (
            <ConnectionErrorView openOptions={openOptions} retryActivation={() => tryActivation(pendingConnection)} />
          )
        ) : (
          <AutoColumn gap="16px">
            <OptionGrid data-testid="option-grid">
              {connections.map((connection) =>
                connection.shouldDisplay() ? (
                  <Option
                    key={connection.getName()}
                    connection={connection}
                    activate={() => tryActivation(connection)}
                    pendingConnectionType={pendingConnection?.type}
                  />
                ) : null
              )}
            </OptionGrid>
          </AutoColumn>
        )}
      </AutoColumn>

    </Wrapper>
  )
}