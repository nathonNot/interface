import { Currency } from '@uniswap/sdk-core'
import styled from 'styled-components/macro'

const Wrapper = styled.div<{ margin: boolean; sizeraw: number; fontSize: number; fontWeight?: number; }>`
  position: relative;
  display: flex;
  flex-direction: row;
  color: ${({ theme }) => theme.white};
  font-size: ${({ fontSize }) => `${fontSize}px`};
  font-weight: ${({ fontWeight }) => fontWeight ?? 500};
`

interface DoubleCurrencyNameProps {
  margin?: boolean;
  size?: number;
  fontWeight?: number;
  currency0?: Currency;
  currency1?: Currency;
}

export default function DoubleCurrencyName({
  currency0,
  currency1,
  size = 24,
  fontWeight = 500,
  margin = false,
}: DoubleCurrencyNameProps) {
  return (
    <Wrapper sizeraw={size} fontSize={size} fontWeight={fontWeight} margin={margin}>
      &nbsp;{currency1?.symbol}&nbsp;/&nbsp;{currency0?.symbol}
    </Wrapper>
  )
}
