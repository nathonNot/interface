import { Trans } from '@lingui/macro'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import RangeBadge from 'components/Badge/RangeBadge'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { Break } from 'components/earn/styled'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import RateToggle from 'components/RateToggle'
import Row, { RowBetween, RowFixed } from 'components/Row'
import JSBI from 'jsbi'
import { ReactNode, useCallback, useState } from 'react'
import { Bound } from 'state/mint/v3/actions'
import styled from 'styled-components'
import { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { formatTickPrice } from 'utils/formatTickPrice'
import { unwrappedToken } from 'utils/unwrappedToken'

const LightCard = styled(Card)`
  fontSize: ${({ fontSize }) => fontSize ? `${String(fontSize)}px` : '18px'};
  border: 1px solid #7B7995;
  border-radius: 12px;
  padding: 12px;
  background-color: transparent;
`

export const PositionPreview = ({
  position,
  title,
  inRange,
  baseCurrencyDefault,
  ticksAtLimit,
}: {
  position: Position
  title?: ReactNode
  inRange: boolean
  baseCurrencyDefault?: Currency | undefined
  ticksAtLimit: { [bound: string]: boolean | undefined }
}) => {
  const theme = useTheme()

  const currency0 = unwrappedToken(position.pool.token0)
  const currency1 = unwrappedToken(position.pool.token1)

  // track which currency should be base
  const [baseCurrency, setBaseCurrency] = useState(
    baseCurrencyDefault
      ? baseCurrencyDefault === currency0
        ? currency0
        : baseCurrencyDefault === currency1
          ? currency1
          : currency0
      : currency0
  )

  const sorted = baseCurrency === currency0
  const quoteCurrency = sorted ? currency1 : currency0

  const price = sorted ? position.pool.priceOf(position.pool.token0) : position.pool.priceOf(position.pool.token1)

  const priceLower = (sorted ? position.token0PriceLower : position.token0PriceUpper.invert()) as unknown as Price<Token, Token>
  const priceUpper = (sorted ? position.token0PriceUpper : position.token0PriceLower.invert()) as unknown as Price<Token, Token>

  const handleRateChange = useCallback(() => {
    setBaseCurrency(quoteCurrency)
  }, [quoteCurrency])

  const removed = position?.liquidity && JSBI.equal(position?.liquidity, JSBI.BigInt(0))

  return (
    <AutoColumn gap="27px">
      <LightCard>
        <RowBetween>
          <Row gap='8px'>
            <DoubleCurrencyLogo
              currency0={currency0 ?? undefined}
              currency1={currency1 ?? undefined}
              size={24}
              margin={true}
            />
            <ThemedText.DeprecatedLabel fontSize="24px">
              {currency0?.symbol} / {currency1?.symbol}
            </ThemedText.DeprecatedLabel>
          </Row>
          <ThemedText.DeprecatedLabel>
            <Trans>{position?.pool?.fee / 10000}%</Trans>
          </ThemedText.DeprecatedLabel>
        </RowBetween>
      </LightCard>
      <AutoColumn gap="8px">
        <ThemedText.DeprecatedBody color='white'>Pool Current Price</ThemedText.DeprecatedBody>
        <LightCard>
          <RowBetween>
            <ThemedText.DeprecatedMain fontSize="14px">
              <Trans>1 {baseCurrency.symbol} = {`${position.pool.priceOf(position.pool.token0).toSignificant(5)} `}{quoteCurrency.symbol}</Trans>
            </ThemedText.DeprecatedMain>
            <ThemedText.DeprecatedMain fontSize="14px">
              <Trans>1 {quoteCurrency.symbol} = {`${position.pool.priceOf(position.pool.token1).toSignificant(5)} `}{baseCurrency.symbol}</Trans>
            </ThemedText.DeprecatedMain>
          </RowBetween>
        </LightCard>
      </AutoColumn>

      <AutoColumn gap="8px">
        <ThemedText.DeprecatedBody color='white'>Price Range</ThemedText.DeprecatedBody>
        <LightCard>
          <AutoColumn gap="10px">
            <Row gap='8px'>
              <CurrencyLogo hideL2Icon currency={currency0} size='24px' />
              <ThemedText.SubHeaderSmall color='white'>
                <Trans>1 {baseCurrency.symbol} = {formatTickPrice({
                  price: position.token0PriceLower as unknown as Price<Token, Token>,
                  atLimit: ticksAtLimit,
                  direction: Bound.LOWER,
                })} - {formatTickPrice({
                  price: position.token0PriceUpper as unknown as Price<Token, Token>,
                  atLimit: ticksAtLimit,
                  direction: Bound.UPPER,
                })} {quoteCurrency.symbol}</Trans>
              </ThemedText.SubHeaderSmall>
            </Row>
            <Row gap='8px'>
              <CurrencyLogo hideL2Icon currency={currency1} size='24px' />
              <ThemedText.SubHeaderSmall color='white'>
                <Trans>1 {quoteCurrency.symbol} = {formatTickPrice({
                  price: position.token0PriceUpper.invert() as unknown as Price<Token, Token>,
                  atLimit: ticksAtLimit,
                  direction: Bound.LOWER,
                })} - {formatTickPrice({
                  price: position.token0PriceLower.invert() as unknown as Price<Token, Token>,
                  atLimit: ticksAtLimit,
                  direction: Bound.UPPER,
                })} {baseCurrency.symbol}</Trans>
              </ThemedText.SubHeaderSmall>
            </Row>
          </AutoColumn>
        </LightCard>
      </AutoColumn>

      <AutoColumn gap="8px">
        <ThemedText.DeprecatedBody color='white'>Amount</ThemedText.DeprecatedBody>
        <LightCard>
            <Row gap='10px'>
              <ThemedText.DeprecatedLabel>{position.amount0.toSignificant(4)}</ThemedText.DeprecatedLabel>
              <Row gap='4px' width='auto'>
                <CurrencyLogo currency={currency0} />
                <ThemedText.DeprecatedLabel>{currency0?.symbol}</ThemedText.DeprecatedLabel>
              </Row>
              <div>+</div>
              <ThemedText.DeprecatedLabel>{position.amount1.toSignificant(4)}</ThemedText.DeprecatedLabel>
              <Row gap='4px' width='auto'>
                <CurrencyLogo currency={currency1} />
                <ThemedText.DeprecatedLabel>{currency1?.symbol}</ThemedText.DeprecatedLabel>
              </Row>
            </Row>
        </LightCard>
      </AutoColumn>

      <ThemedText.BodySmall color='#8E8E8E'>Please pay attention to whether the current price deviates significantlyfrom the market price. if so, it may present arbitrage opportunities thatcould result in asset losses.</ThemedText.BodySmall>
    </AutoColumn>
  )
}
