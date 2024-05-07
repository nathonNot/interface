import { Trans } from '@lingui/macro'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ButtonRadioChecked } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { useFeeTierDistribution } from 'hooks/useFeeTierDistribution'
import { PoolState } from 'hooks/usePools'
import React from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { FeeTierPercentageBadge } from './FeeTierPercentageBadge'
import { FEE_AMOUNT_DETAIL } from './shared'

const ResponsiveText = styled(ThemedText.DeprecatedLabel)`
  line-height: 24px;
  font-weight: 500 !important;
  color: #F4F4F4;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    font-size: 12px;
    line-height: 12px;
  `};
`

interface FeeOptionProps {
  feeAmount: FeeAmount
  active: boolean
  distributions: ReturnType<typeof useFeeTierDistribution>['distributions']
  poolState: PoolState
  onClick: () => void
}

export function FeeOption({ feeAmount, active, poolState, distributions, onClick }: FeeOptionProps) {
  return (
    <ButtonRadioChecked active={active} onClick={onClick}>
      <ResponsiveText>
        <Trans>{Number(FEE_AMOUNT_DETAIL[feeAmount].label)?.toFixed(2)}%</Trans>
      </ResponsiveText>
    </ButtonRadioChecked>
  )
}
