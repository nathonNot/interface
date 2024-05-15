import DoubleCurrencyName from "components/DoubleCurrencyName"
import DoubleCurrencyLogo from "components/DoubleLogo"
import Row from "components/Row"
import { useToken } from "hooks/Tokens"
import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import styled from "styled-components"
import { unwrappedToken } from "utils/unwrappedToken"

interface PositionListItemProps {
  token0: string
  token1: string
  // tokenId: BigNumber
  fee: number
  // liquidity: BigNumber
  // tickLower: number
  // tickUpper: number
  isMobile?: boolean
}

const FeeTierText = styled.div<{ isMobile?: boolean }>`
  border-radius: 4px;
  font-size: ${({ isMobile }) => `${isMobile ? 12 : 14}px`};
  padding: ${({ isMobile }) => `${isMobile ? 2 : 4}px 8px`};
  font-weight: 600;
  color: ${({ theme }) => theme.primary};
  background: ${({ theme }) => `${theme.primary}40`};

`

const TokenInfo = ({
  token0: token0Address,
  token1: token1Address,
  fee,
  isMobile = false
}: PositionListItemProps) => {
  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  if (isMobile) {
    return (
      <Row gap='6px'>
        <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={20} margin diff />
        <DoubleCurrencyName currency0={currency0} currency1={currency1} size={14} />
        <FeeTierText isMobile={isMobile}>
          <Trans>{new Percent(fee, 1_000_000).toSignificant()}%</Trans>
        </FeeTierText>
      </Row>
    )
  }

  return (
    <>
      <Row gap='12px'>
        <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={20} margin diff />
        <DoubleCurrencyName currency0={currency0} currency1={currency1} size={16} />
        <FeeTierText>
          <Trans>{new Percent(fee, 1_000_000).toSignificant()}%</Trans>
        </FeeTierText>
      </Row>
    </>
  )
}

export default TokenInfo;