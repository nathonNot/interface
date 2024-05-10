import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { SwapEventName, SwapPriceUpdateUserResponse } from '@uniswap/analytics-events'
import { Currency, Percent, TradeType, Price, Token } from '@uniswap/sdk-core'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { getPriceUpdateBasisPoints } from 'lib/utils/analytics'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowDown } from 'react-feather'
import { Text } from 'rebass'
import { InterfaceTrade } from 'state/routing/types'
import styled, { useTheme } from 'styled-components/macro'

import { ThemedText } from '../../theme'
import { isAddress, shortenAddress } from '../../utils'
import { computeFiatValuePriceImpact } from '../../utils/computeFiatValuePriceImpact'
import { ButtonPrimary } from '../Button'
import { LightCard } from '../Card'
import { AutoColumn } from '../Column'
import { FiatValue } from '../CurrencyInputPanel/FiatValue'
import CurrencyLogo from '../Logo/CurrencyLogo'
import Row, { RowBetween, RowFixed } from '../Row'
import TradePrice from '../swap/TradePrice'
import { AdvancedSwapDetails } from './AdvancedSwapDetails'
import { SwapShowAcceptChanges, TruncatedText } from './styleds'

const ArrowWrapper = styled.div`
  height: 25px;
  width: 25px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
  transform: translateX(25%);
`

const formatAnalyticsEventProperties = (
  trade: InterfaceTrade<Currency, Currency, TradeType>,
  priceUpdate: number | undefined,
  response: SwapPriceUpdateUserResponse
) => ({
  chain_id:
    trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
      ? trade.inputAmount.currency.chainId
      : undefined,
  response,
  token_in_symbol: trade.inputAmount.currency.symbol,
  token_out_symbol: trade.outputAmount.currency.symbol,
  price_update_basis_points: priceUpdate,
})

const SwapTradContent = ({
  trade,
  type
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  type: 'input' | 'output'
}) => {
  let data = trade.outputAmount;
  if (type === 'input') {
    data = trade.inputAmount;
  }

  const config = useMemo(() => {
    return {
      fontSize: 18,
      fontWeight: 600,
      color: '#F4F4F4'
    }
  }, []);
  return (
    <RowBetween align="center">
      <Row gap="8px">
        <CurrencyLogo currency={data.currency} size="36px" />
        <TruncatedText
          data-testid={`${type}-amount`}
          {...config}
        >
          {data.toSignificant(6)}
        </TruncatedText>
      </Row>
      <Text data-testid={`${type}-symbol`} {...config}>
        {data.currency.symbol}
      </Text>
    </RowBetween>
  )
}

export default function SwapModalHeader({
  trade,
  shouldLogModalCloseEvent,
  setShouldLogModalCloseEvent,
  allowedSlippage,
  recipient,
  showAcceptChanges,
  onAcceptChanges,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  shouldLogModalCloseEvent: boolean
  setShouldLogModalCloseEvent: (shouldLog: boolean) => void
  allowedSlippage: Percent
  recipient: string | null
  showAcceptChanges: boolean
  onAcceptChanges: () => void
}) {
  const theme = useTheme()

  const [lastExecutionPrice, setLastExecutionPrice] = useState(trade.executionPrice)
  const [priceUpdate, setPriceUpdate] = useState<number | undefined>()

  const fiatValueInput = useUSDPrice(trade.inputAmount)
  const fiatValueOutput = useUSDPrice(trade.outputAmount)

  useEffect(() => {
    if (!trade.executionPrice.equalTo(lastExecutionPrice)) {
      setPriceUpdate(getPriceUpdateBasisPoints(lastExecutionPrice as unknown as Price<Token, Token>, trade.executionPrice as unknown as Price<Token, Token>))
      setLastExecutionPrice(trade.executionPrice)
    }
  }, [lastExecutionPrice, setLastExecutionPrice, trade.executionPrice])

  useEffect(() => {
    if (shouldLogModalCloseEvent && showAcceptChanges) {
      sendAnalyticsEvent(
        SwapEventName.SWAP_PRICE_UPDATE_ACKNOWLEDGED,
        formatAnalyticsEventProperties(trade, priceUpdate, SwapPriceUpdateUserResponse.REJECTED)
      )
    }
    setShouldLogModalCloseEvent(false)
  }, [shouldLogModalCloseEvent, showAcceptChanges, setShouldLogModalCloseEvent, trade, priceUpdate])

  return (
    <AutoColumn gap="27px">
      <AutoColumn gap="12px">
        {SwapTradContent({ trade: trade, type: 'input' })}
        <ArrowWrapper>
          <ArrowDown size="30" color={theme.textPrimary} />
        </ArrowWrapper>
        {SwapTradContent({ trade: trade, type: 'output' })}
      </AutoColumn>

      <AutoColumn justify="flex-start" gap="sm">
        <ThemedText.DeprecatedItalic fontWeight={400} fontSize={18} textAlign="left" style={{ width: '100%', color: 'rgba(255, 255, 255, 0.50)' }}>
          {trade.tradeType === TradeType.EXACT_INPUT ? (
            <Trans>
              Output is estimated. You will receive at least{' '}
              <b style={{ color: theme.primary }}>
                {trade.minimumAmountOut(allowedSlippage).toSignificant(6)} {trade.outputAmount.currency.symbol}
              </b>{' '}
              or the transaction will revert.
            </Trans>
          ) : (
            <Trans>
              Input is estimated. You will sell at most{' '}
              <b style={{ color: theme.primary }}>
                {trade.maximumAmountIn(allowedSlippage).toSignificant(6)} {trade.inputAmount.currency.symbol}
              </b>{' '}
              or the transaction will revert.
            </Trans>
          )}
        </ThemedText.DeprecatedItalic>
      </AutoColumn>
      {/* <RowBetween style={{ marginTop: '0.25rem', padding: '0 1rem' }}>
        <TradePrice price={trade.executionPrice as unknown as Price<Token, Token>} />
      </RowBetween> */}
      <AdvancedSwapDetails trade={trade} allowedSlippage={allowedSlippage} />
      {/* {showAcceptChanges ? (
        <SwapShowAcceptChanges justify="flex-start" gap="0px" data-testid="show-accept-changes">
          <RowBetween>
            <RowFixed>
              <AlertTriangle size={20} style={{ marginRight: '8px', minWidth: 24 }} />
              <ThemedText.DeprecatedMain color={theme.accentAction}>
                <Trans>Price Updated</Trans>
              </ThemedText.DeprecatedMain>
            </RowFixed>
            <ButtonPrimary
              style={{ padding: '.5rem', width: 'fit-content', fontSize: '0.825rem', borderRadius: '12px' }}
              onClick={onAcceptChanges}
            >
              <Trans>Accept</Trans>
            </ButtonPrimary>
          </RowBetween>
        </SwapShowAcceptChanges>
      ) : null}


      {recipient !== null ? (
        <AutoColumn justify="flex-start" gap="sm" style={{ padding: '12px 0 0 0px' }} data-testid="recipient-info">
          <ThemedText.DeprecatedMain>
            <Trans>
              Output will be sent to{' '}
              <b title={recipient}>{isAddress(recipient) ? shortenAddress(recipient) : recipient}</b>
            </Trans>
          </ThemedText.DeprecatedMain>
        </AutoColumn>
      ) : null} */}
    </AutoColumn>
  )
}
