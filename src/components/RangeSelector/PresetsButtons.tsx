import { Trans } from '@lingui/macro'
import { ButtonOutlined } from 'components/Button'
import { AutoRow } from 'components/Row'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const Button = styled(ButtonOutlined).attrs(() => ({
  padding: '8px',
  $borderRadius: '6px',
}))`
  color: ${({ theme }) => theme.primary};
  flex: 1;
  border: 1px solid ${({ theme }) => theme.primary};
  background: #312E63;
  height: 36px;
  
`

interface PresetsButtonsProps {
  onSetFullRange: () => void
}

export default function PresetsButtons({ onSetFullRange }: PresetsButtonsProps) {
  return (
    <AutoRow gap="4px" width="auto">
      <Button onClick={onSetFullRange}>
        <Trans>Full Range</Trans>
      </Button>
    </AutoRow>
  )
}
