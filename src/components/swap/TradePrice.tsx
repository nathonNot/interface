import { Trans } from '@lingui/macro'
import { formatNumber, NumberType } from '@uniswap/conedison/format'
import { Currency, Price } from '@uniswap/sdk-core'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyName from 'components/DoubleCurrencyName'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { useUSDPrice } from 'hooks/useUSDPrice'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useIsMobile } from 'nft/hooks'
import { useCallback, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { formatTransactionAmount, priceToPreciseFloat } from 'utils/formatNumbers'

interface TradePriceProps {
  price: Price<Currency, Currency>
}

const StyledPriceContainer = styled.button`
  width: 100%;
  background-color: transparent;
  border: none;
  cursor: pointer;
  align-items: center;
  justify-content: flex-start;
  padding: 0;
  grid-template-columns: 1fr auto;
  grid-gap: 0.25rem;
  display: flex;
  flex-direction: row;
  text-align: left;
  flex-wrap: wrap;
  padding: 8px 0;
  user-select: text;
  // justify-content: space-between;
  gap: 10px;
`

const CurrencyLogoBox = styled.div`
  display: flex;
`

export default function TradePrice({ price }: TradePriceProps) {
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const isMobile = useIsMobile();

  const { baseCurrency, quoteCurrency } = price
  const { data: usdPrice } = useUSDPrice(tryParseCurrencyAmount('1', showInverted ? baseCurrency : quoteCurrency))

  let formattedPrice: string
  try {
    formattedPrice = showInverted
      ? formatTransactionAmount(priceToPreciseFloat(price))
      : formatTransactionAmount(priceToPreciseFloat(price.invert()))
  } catch (error) {
    formattedPrice = '0'
  }

  const label = showInverted ? `${price.quoteCurrency?.symbol}` : `${price.baseCurrency?.symbol} `
  const labelInverted = showInverted ? `${price.baseCurrency?.symbol} ` : `${price.quoteCurrency?.symbol}`
  const flipPrice = useCallback(() => setShowInverted(!showInverted), [setShowInverted, showInverted])

  const text = `${'1 ' + labelInverted + ' = ' + formattedPrice ?? '-'} ${label}`

  const info = {
    currency0: showInverted ? price.quoteCurrency : price.baseCurrency,
    currency1: showInverted ? price.baseCurrency : price.quoteCurrency
  }
  return (
    <StyledPriceContainer
      onClick={(e) => {
        e.stopPropagation() // dont want this click to affect dropdowns / hovers
        flipPrice()
      }}
      title={text}
    >
      <DoubleCurrencyLogo size={32} {...info} margin />
      {
        isMobile ? (
          <AutoColumn>
            <DoubleCurrencyName {...info} size={16} fontWeight={600} />
            <Text fontSize={12} fontWeight={500} color='#fff' marginLeft='auto'>{text}</Text>{' '}
          </AutoColumn>
        ) : (
          <>
            <DoubleCurrencyName {...info} size={20} fontWeight={600} />
            <Text fontSize={20} fontWeight={600} color='#fff' marginLeft='auto'>{text}</Text>{' '}
          </>
        )
      }
      {usdPrice && (
        <ThemedText.DeprecatedDarkGray>
          <Trans>({formatNumber(usdPrice, NumberType.FiatTokenPrice)})</Trans>
        </ThemedText.DeprecatedDarkGray>
      )}
    </StyledPriceContainer>
  )
}
