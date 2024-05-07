import { Trans } from '@lingui/macro'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ButtonGray } from 'components/Button'
import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { Minus, Plus } from 'react-feather'
import styled, { keyframes } from 'styled-components/macro'
import { ThemedText } from 'theme'

import { Input as NumericalInput } from '../NumericalInput'

const pulse = (color: string) => keyframes`
  0% {
    box-shadow: 0 0 0 0 ${color};
  }

  70% {
    box-shadow: 0 0 0 2px ${color};
  }

  100% {
    box-shadow: 0 0 0 0 ${color};
  }
`

const InputRow = styled.div`
  display: grid;

  grid-template-columns: 30px 1fr 30px;
`

const SmallButton = styled(ButtonGray)`
  border-radius: 8px;
  padding: 4px;
  border: none;
  background: transparent;
`

const FocusedOutlineCard = styled(OutlineCard)<{ active?: boolean; pulsing?: boolean }>`
  border-color: ${({ active, theme }) => active && theme.accentAction};
  border: none;
  border-radius: 12px;
  background: radial-gradient(123.22% 129.67% at 100.89% -5.6%, #201D47 0%, #17153A 100%);
  padding: 12px 20px;
  animation: ${({ pulsing, theme }) => pulsing && pulse(theme.accentAction)} 0.8s linear;
`

const StyledInput = styled(NumericalInput)<{ usePercent?: boolean }>`
  background-color: transparent;
  text-align: center;
  width: 100%;
  font-weight: 500;
  padding: 0 10px;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    font-size: 16px;
  `};

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToExtraSmall`
    font-size: 12px;
  `};
`

const InputTitle = styled(ThemedText.DeprecatedSmall)`
  color: #F4F4F4;
  font-size: 18px;
  font-weight: 500;
`

const InputDesc = styled(ThemedText.DeprecatedSmall)`
  color: #8E8E8E;
  font-size: 14px;
  font-weight: 400;
`

const ButtonLabel = styled(ThemedText.DeprecatedWhite)<{ disabled: boolean }>`
  color: ${({ theme, disabled }) => (disabled ? theme.textSecondary : theme.textPrimary)} !important;
`

interface StepCounterProps {
  value: string
  onUserInput: (value: string) => void
  decrement: () => string
  increment: () => string
  decrementDisabled?: boolean
  incrementDisabled?: boolean
  feeAmount?: FeeAmount
  label?: string
  width?: string
  locked?: boolean // disable input
  title: ReactNode
  tokenA: string | undefined
  tokenB: string | undefined
}

const StepCounter = ({
  value,
  decrement,
  increment,
  decrementDisabled = false,
  incrementDisabled = false,
  width,
  locked,
  onUserInput,
  title,
  tokenA,
  tokenB,
}: StepCounterProps) => {
  //  for focus state, styled components doesnt let you select input parent container
  const [active, setActive] = useState(false)

  // let user type value and only update parent value on blur
  const [localValue, setLocalValue] = useState('')
  const [useLocalValue, setUseLocalValue] = useState(false)

  // animation if parent value updates local value
  const [pulsing, setPulsing] = useState<boolean>(false)

  const handleOnFocus = () => {
    setUseLocalValue(true)
    setActive(true)
  }

  const handleOnBlur = useCallback(() => {
    setUseLocalValue(false)
    setActive(false)
    onUserInput(localValue) // trigger update on parent value
  }, [localValue, onUserInput])

  // for button clicks
  const handleDecrement = useCallback(() => {
    setUseLocalValue(false)
    onUserInput(decrement())
  }, [decrement, onUserInput])

  const handleIncrement = useCallback(() => {
    setUseLocalValue(false)
    onUserInput(increment())
  }, [increment, onUserInput])

  useEffect(() => {
    if (localValue !== value && !useLocalValue) {
      setTimeout(() => {
        setLocalValue(value) // reset local value to match parent
        setPulsing(true) // trigger animation
        setTimeout(function () {
          setPulsing(false)
        }, 1800)
      }, 0)
    }
  }, [localValue, useLocalValue, value])

  return (
    <FocusedOutlineCard pulsing={pulsing} active={active} onFocus={handleOnFocus} onBlur={handleOnBlur} width={width}>
      <AutoColumn gap="11px">
        <InputTitle fontSize={18} textAlign="center">
          {title}
        </InputTitle>

        <InputRow>
          {!locked && (
            <SmallButton onClick={handleDecrement} disabled={decrementDisabled}>
              <ButtonLabel disabled={decrementDisabled} fontSize="12px">
                <Minus size={18} />
              </ButtonLabel>
            </SmallButton>
          )}

          <StyledInput
            className="rate-input-0"
            value={localValue}
            fontSize="20px"
            disabled={locked}
            onUserInput={(val) => {
              setLocalValue(val)
            }}
          />

          {!locked && (
            <SmallButton onClick={handleIncrement} disabled={incrementDisabled}>
              <ButtonLabel disabled={incrementDisabled} fontSize="12px">
                <Plus size={18} />
              </ButtonLabel>
            </SmallButton>
          )}
        </InputRow>

        <InputDesc fontSize={14} fontWeight={400} textAlign="center">
          <Trans>
            {tokenB} per {tokenA}
          </Trans>
        </InputDesc>
      </AutoColumn>
    </FocusedOutlineCard>
  )
}

export default StepCounter
