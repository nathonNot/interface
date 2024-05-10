import { Trans } from '@lingui/macro'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import RangeBadge from 'components/Badge/RangeBadge'
import { LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { Break } from 'components/earn/styled'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import RateToggle from 'components/RateToggle'
import Row, { RowBetween, RowFixed } from 'components/Row'
import JSBI from 'jsbi'
import { ReactNode, useCallback, useState } from 'react'
import { Bound } from 'state/mint/v3/actions'
import { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { formatTickPrice } from 'utils/formatTickPrice'
import { unwrappedToken } from 'utils/unwrappedToken'

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
    <Row gap='12px'>
      <DoubleCurrencyLogo
        currency0={currency0 ?? undefined}
        currency1={currency1 ?? undefined}
        size={40}
        margin={true}
      />
      <AutoColumn gap='2px'>
        <ThemedText.DeprecatedBlack fontSize="24px">
          {currency0?.symbol} / {currency1?.symbol}
        </ThemedText.DeprecatedBlack>
        <Row color='#9B98D0'>
          <ThemedText.DeprecatedBlack color='#9B98D0'>
            <Trans>Fee Rate:</Trans>
          </ThemedText.DeprecatedBlack>
          <ThemedText.DeprecatedBlack color='primary'>
            <Trans>{position?.pool?.fee / 10000}%</Trans>
          </ThemedText.DeprecatedBlack>
        </Row>
      </AutoColumn>
    </Row>
  )
}

{/* <RowBetween>
        <ThemedText.DeprecatedLabel>
          <Trans>Fee Tier</Trans>
        </ThemedText.DeprecatedLabel>
        <ThemedText.DeprecatedLabel>
          <Trans>{position?.pool?.fee / 10000}%</Trans>
        </ThemedText.DeprecatedLabel>
      </RowBetween> */}