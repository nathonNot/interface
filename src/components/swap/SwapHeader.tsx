import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useFiatOnRampButtonEnabled } from 'featureFlags/flags/fiatOnRampButton'
import { subhead } from 'nft/css/common.css'
import styled from 'styled-components/macro'

import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'
import SwapBuyFiatButton from './SwapBuyFiatButton'
import { useIsMobile } from 'nft/hooks'

const StyledSwapHeader = styled.div`
  // padding: 8px 12px;
  // margin-bottom: 24px;
  width: 100%;
  color: ${({ theme }) => theme.textSecondary};
`

const TextHeader = styled.div<{ isMobile: boolean }>`
  color: ${({ theme }) => theme.textPrimary};
  margin-right: 8px;
  display: flex;
  // line-height: 20px;
  line-height: normal;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  font-size: ${({ isMobile }) => `${isMobile ? 26 : 32}px`};
  font-weight: 600;
  color: ${({ theme }) => theme.white};
`

export default function SwapHeader({ allowedSlippage }: { allowedSlippage: Percent }) {
  const fiatOnRampButtonEnabled = useFiatOnRampButtonEnabled()
  const isMobile = useIsMobile();

  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed style={{ gap: '8px' }}>
          <TextHeader className={subhead} isMobile={isMobile}>
            <Trans>Swap</Trans>
          </TextHeader>
          {/* {fiatOnRampButtonEnabled && <SwapBuyFiatButton />} */}
        </RowFixed>
        <RowFixed>
          <SettingsTab placeholderSlippage={allowedSlippage} />
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  )
}
