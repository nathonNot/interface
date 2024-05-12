import { sendAnalyticsEvent, user } from '@uniswap/analytics'
import { t } from '@lingui/macro'
import { CustomUserProperties, InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { getWalletMeta } from '@uniswap/conedison/provider/meta'
import { useWeb3React } from '@web3-react/core'
import { useAccountDrawer } from 'components/AccountDrawer'
import IconButton from 'components/AccountDrawer/IconButton'
import { sendEvent } from 'components/analytics'
import { AutoColumn } from 'components/Column'
import { AutoRow, RowBetween } from 'components/Row'
import { Connection, ConnectionType, getConnections, networkConnection } from 'connection'
import { useGetConnection } from 'connection'
import { ErrorCode } from 'connection/utils'
import { isSupportedChain } from 'constants/chains'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Circle, Settings } from 'react-feather'
import { useAppDispatch } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import { useConnectedWallets } from 'state/wallets/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { CloseIcon, ThemedText } from 'theme'
import { flexColumnNoWrap } from 'theme/styles'

import ConnectionErrorView from './ConnectionErrorView'
import Option from './Option'
import PrivacyPolicyNotice from './PrivacyPolicyNotice'
import { Typography } from 'antd';
import { MouseoverTooltip } from 'components/Tooltip'
import { Row } from 'nft/components/Flex'
import { getChainInfo } from 'constants/chainInfo'
import * as styles from './ChainSelector.css'
// import Button from 'components/Button'

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
  grid-gap: 2px;
  border-radius: 12px;
  overflow: hidden;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    grid-template-columns: 1fr;
  `};
`

const PrivacyPolicyWrapper = styled.div`
  padding: 0 4px;
`

const Button = styled.div`
  cursor: pointer;
  height: 52px;
  border: 1px solid ${({ theme }) => theme.primary};
  border-radius: 15px;
  color: ${({ theme }) => theme.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
`

const Container = styled.div`
  
`;

const Box = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.title}
`;

const Title = styled.div`
  // font-size: 16px;
  margin-bottom: 8px;
`

const Address = styled.div`
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #7B7995;
  border-radius: 12px;
  padding: 12px;
`

const ChainBox = styled.div`
  width: fit-content;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 8px;

  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.title};
  background: #312E59;
  border-radius: 12px;
`

const BalanceBox = styled.div`
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  color: #BEBEBE;
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

export default function WalletInfoModal({ closeModal, isMobile = false }: { closeModal: () => void; isMobile?: boolean }) {
  const dispatch = useAppDispatch()
  const { connector, account, chainId, provider, ENSName } = useWeb3React()

  const [connectedWallets, addWalletToConnectedWallets] = useConnectedWallets()
  const [lastActiveWalletAddress, setLastActiveWalletAddress] = useState<string | undefined>(account)
  const [pendingConnection, setPendingConnection] = useState<Connection | undefined>()
  const [pendingError, setPendingError] = useState<any>()

  const connections = getConnections()
  const getConnection = useGetConnection()
  const theme = useTheme()

  const info = chainId ? getChainInfo(chainId) : undefined

  const isSupported = !!info;

  useEffect(() => {
    // Clean up errors when the dropdown closes
    return () => setPendingError(undefined)
  }, [setPendingError])

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


  const disconnect = useCallback(() => {
    if (connector && connector.deactivate) {
      connector.deactivate()
    }
    connector.resetState()
    dispatch(updateSelectedWallet({ wallet: undefined }))
    closeModal()
  }, [connector, dispatch])

  return (
    <Wrapper data-testid="wallet-modal" isMobile={isMobile}>
      <AutoColumn gap='27px'>
        <RowBetween width="100%">
          <ThemedText.SubHeader fontWeight={600} fontSize={24}>Wallet</ThemedText.SubHeader>
          <CloseIcon onClick={closeModal} data-testid="wallet-close" />
        </RowBetween>
        <Box>
          <Title>Your Address</Title>
          <Address>
            <Typography.Paragraph copyable style={{ color: '#E4E4E5', margin: 0 }}>{ENSName ?? account}</Typography.Paragraph>
          </Address>
        </Box>
        <Box>
          {!isSupported ? (
            <AlertTriangle size={20} color={theme.textSecondary} />
          ) : (
            <ChainBox>
              <img src={info.logoUrl} alt={info.label} className={styles.Image} data-testid="chain-selector-logo" />
              <div>{info.label}</div>
            </ChainBox>
          )}
          {/* {
            isSupported && (
              <BalanceBox>
                <div>Balance</div>
              </BalanceBox>
            )
          } */}
        </Box>
        <Button onClick={disconnect}>Disconnect Wallet</Button>
      </AutoColumn>

    </Wrapper>
  )
}
