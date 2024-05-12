import { Trans } from '@lingui/macro'
import styled, { useTheme } from 'styled-components/macro'

import { useMemo } from 'react'

const LabelText = styled.div<{ color: string }>`
  border-radius: 4px;

  padding: 8px 12px;
  background: ${({ color }) => color};
  font-size: 16px;
  font-weight: 600;
  color: #F4F4F4;

  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;

`

export default function RangeBadge({
  removed,
  inRange,
}: {
  removed: boolean | undefined
  inRange: boolean | undefined
}) {
  const theme = useTheme()

  const info = useMemo(() => {
    if (removed) {
      return {
        text: 'Closed',
        color: '#F4418B'
      }
    }

    if (inRange) {
      return {
        text: 'Active',
        color: '#30E0A1'
      }
    }

    return {
      text: 'Out of range',
      color: '#D29404'
    }
  }, [removed, inRange])
  return (
    <LabelText color={info.color}>
      <Trans>{info.text}</Trans>
    </LabelText>
  )
}
