import { Currency } from '@uniswap/sdk-core'
import styled from 'styled-components/macro'

const Wrapper = styled.div<{ margin: boolean; sizeraw: number }>`
  position: relative;
  display: flex;
  flex-direction: row;
  margin-left: ${({ sizeraw, margin }) => margin && (sizeraw / 3 + 8).toString() + 'px'};
  color: ${({ theme }) => theme.white}
`

interface DoubleCurrencyLogoProps {
  margin?: boolean
  size?: number
  currency0?: Currency
  currency1?: Currency
}

export default function DoubleCurrencyName({
  currency0,
  currency1,
  size = 24,
  margin = false,
}: DoubleCurrencyLogoProps) {
  return (
    <Wrapper sizeraw={size} margin={margin}>
      &nbsp;{currency1?.symbol}&nbsp;/&nbsp;{currency0?.symbol}
    </Wrapper>
  )
}
