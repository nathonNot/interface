import { BigNumber } from '@ethersproject/bignumber'
import { Trans } from '@lingui/macro'
import { Percent, Price, Token } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import RangeBadge from './RangeBadge'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverInlineText from 'components/HoverInlineText'
import Loader from 'components/Icons/LoadingSpinner'
import { RowBetween } from 'components/Row'
import { useToken } from 'hooks/Tokens'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { usePool } from 'hooks/usePools'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bound } from 'state/mint/v3/actions'
import styled from 'styled-components/macro'
import { HideSmall, MEDIA_WIDTHS, SmallOnly, ThemedText } from 'theme'
import { formatTickPrice } from 'utils/formatTickPrice'
import { unwrappedToken } from 'utils/unwrappedToken'

import { DAI, USDC_MAINNET, USDT, WBTC, WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import DoubleCurrencyName from 'components/DoubleCurrencyName'
import { AutoColumn } from 'components/Column'

const LinkRow = styled(Link)`
  border-radius: 16px;
  padding: 24px 32px;
  background: ${({ theme }) => theme.main};

  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  color: #9B98D0;
  text-decoration: none;
  font-weight: 500;

  & > div:not(:first-child) {
    text-align: center;
  }
  :hover {
    background-color: ${({ theme }) => theme.hoverDefault};
  }

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    /* flex-direction: row; */
  }

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-direction: column;
    row-gap: 8px;
  `};
`

const DataLineItem = styled.div`
  font-size: 14px;
`

const RangeLineItem = styled(DataLineItem)`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  color: #9B98D0 !important;
`

const DoubleArrow = styled.span`
  font-size: 12px;
  margin: 0 2px;
  color: ${({ theme }) => theme.textTertiary};
`

const RangeText = styled(ThemedText.Caption)`
  font-size: 16px !important;
  word-break: break-word;
  padding: 0.25rem 0.25rem;
  border-radius: 8px;
  color: #9B98D0;
`

const FeeTierText = styled(ThemedText.UtilityBadge)`
  border-radius: 4px;
  font-size: 14px !important;
  padding: 4px 8px;
  color: ${({ theme }) => theme.primary};
  background: ${({ theme }) => `${theme.primary}40`};

`
const ExtentsText = styled(ThemedText.Caption)`
  // color: ${({ theme }) => theme.textTertiary};
  font-size: 16px !important;
  color: #9B98D0;
  display: inline-block;
  line-height: 16px;
  margin-right: 4px !important;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: none;
  `};
`

const PrimaryPositionIdData = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`

interface PositionListItemProps {
  token0: string
  token1: string
  tokenId: BigNumber
  fee: number
  liquidity: BigNumber
  tickLower: number
  tickUpper: number
}

export function getPriceOrderingFromPositionForUI(position?: Position): {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} {
  if (!position) {
    return {}
  }

  const token0 = position.amount0.currency
  const token1 = position.amount1.currency

  // if token0 is a dollar-stable asset, set it as the quote token
  const stables = [DAI, USDC_MAINNET, USDT]
  if (stables.some((stable) => stable.equals(token0))) {
    return {
      priceLower: position.token0PriceUpper.invert() as unknown as Price<Token, Token>,
      priceUpper: position.token0PriceLower.invert() as unknown as Price<Token, Token>,
      quote: token0,
      base: token1,
    }
  }

  // if token1 is an ETH-/BTC-stable asset, set it as the base token
  const bases = [...Object.values(WRAPPED_NATIVE_CURRENCY), WBTC]
  if (bases.some((base) => base && base.equals(token1))) {
    return {
      priceLower: position.token0PriceUpper.invert() as unknown as Price<Token, Token>,
      priceUpper: position.token0PriceLower.invert() as unknown as Price<Token, Token>,
      quote: token0,
      base: token1,
    }
  }

  // if both prices are below 1, invert
  if (position.token0PriceUpper.lessThan(1)) {
    return {
      priceLower: position.token0PriceUpper.invert() as unknown as Price<Token, Token>,
      priceUpper: position.token0PriceLower.invert() as unknown as Price<Token, Token>,
      quote: token0,
      base: token1,
    }
  }

  // otherwise, just return the default
  return {
    priceLower: position.token0PriceLower as unknown as Price<Token, Token>,
    priceUpper: position.token0PriceUpper as unknown as Price<Token, Token>,
    quote: token1,
    base: token0,
  }
}

export default function PositionListItem({
  token0: token0Address,
  token1: token1Address,
  tokenId,
  fee: feeAmount,
  liquidity,
  tickLower,
  tickUpper,
}: PositionListItemProps) {
  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  // construct Position from details returned
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  const position = useMemo(() => {
    if (pool) {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)

  // prices
  const { priceLower, priceUpper, quote, base } = getPriceOrderingFromPositionForUI(position)

  const currencyQuote = quote && unwrappedToken(quote)
  const currencyBase = base && unwrappedToken(base)

  // check if price is within range
  const outOfRange: boolean = pool ? pool.tickCurrent < tickLower || pool.tickCurrent >= tickUpper : false

  const positionSummaryLink = '/pools/' + tokenId

  const removed = liquidity?.eq(0)

  return (
    <LinkRow to={positionSummaryLink}>
      <RowBetween>
        <AutoColumn gap='12px'>
          <RowBetween>
            <PrimaryPositionIdData>
              <DoubleCurrencyLogo currency0={currencyBase} currency1={currencyQuote} size={28} margin />
              <DoubleCurrencyName currency0={currencyBase} currency1={currencyQuote} />

              <FeeTierText>
                <Trans>{new Percent(feeAmount, 1_000_000).toSignificant()}%</Trans>
              </FeeTierText>
            </PrimaryPositionIdData>
          </RowBetween>

          {priceLower && priceUpper ? (
            <RangeLineItem>
              <RangeText>
                <ExtentsText>
                  <Trans>Min: </Trans>
                </ExtentsText>
                <Trans>
                  <span>
                    {formatTickPrice({
                      price: priceLower,
                      atLimit: tickAtLimit,
                      direction: Bound.LOWER,
                    })}{' '}
                  </span>
                </Trans>
              </RangeText>{' '}
              {/* <HideSmall>
            <DoubleArrow>↔</DoubleArrow>{' '}
          </HideSmall>
          <SmallOnly>
            <DoubleArrow>↔</DoubleArrow>{' '}
          </SmallOnly> */}
              /
              <RangeText>
                <ExtentsText>
                  <Trans>Max.</Trans>
                </ExtentsText>
                <Trans>
                  <span>
                    {formatTickPrice({
                      price: priceUpper,
                      atLimit: tickAtLimit,
                      direction: Bound.UPPER,
                    })}{' '}
                  </span>
                  <HoverInlineText text={currencyQuote?.symbol} /> per{' '}
                  <HoverInlineText maxCharacters={10} text={currencyBase?.symbol} />
                </Trans>
              </RangeText>
              <DoubleArrow>↔</DoubleArrow>{' '}
            </RangeLineItem>
          ) : (
            <Loader />
          )}
        </AutoColumn>
        <RangeBadge removed={removed} inRange={!outOfRange} />
      </RowBetween>
    </LinkRow>
  )
}
