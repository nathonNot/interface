import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { L2_CHAIN_IDS } from 'constants/chains'
import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'
import ms from 'ms.macro'
import { darken } from 'polished'
import { useState } from 'react'
import { useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'

import { ThemedText } from '../../theme'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'

enum SlippageError {
  InvalidInput = 'InvalidInput',
}

enum DeadlineError {
  InvalidInput = 'InvalidInput',
}

const FancyButton = styled.button`
  color: ${({ theme }) => theme.textPrimary};
  align-items: center;
  height: 36px;
  border-radius: 6px;
  font-size: 1rem;
  // width: calc((100% - 3 * 12px) / 4);
  // min-width: 3.5rem;
  border: 1px solid ${({ theme }) => theme.deprecated_bg3};
  outline: none;
  background: ${({ theme }) => theme.deprecated_bg1};
  :hover {
    border: 1px solid ${({ theme }) => theme.deprecated_bg4};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.accentAction};
  }
`

const Option = styled(FancyButton) <{ active: boolean }>`
  margin-right: 12px;
  :hover {
    cursor: pointer;
  }
  background-color: ${({ active, theme }) => active ? theme.primary : '#292751'};
  color: ${({ active, theme }) => (active ? theme.textDefault : theme.primary)};
  // border: 1px solid ${({ active, theme }) => active ? theme.primary : '#8E8E8E'};
`

const Input = styled.input`
  background: transparent;
  font-size: 16px;
  font-weight: 500;
  border-radius: 12px;
  width: auto;
  outline: none;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  color: ${({ theme, color }) => (color === 'red' ? theme.accentFailure : theme.textPrimary)};
  text-align: right;

  ::placeholder {
    color: ${({ theme }) => theme.textTertiary};
  }
`

const OptionCustom = styled(FancyButton) <{ active?: boolean; warning?: boolean }>`
  // height: 2rem;
  position: relative;
  padding: 0 0.75rem;
  border-radius: 6px;
  flex: 1;
  border: ${({ theme, active, warning }) =>
    active
      ? `1px solid ${warning ? theme.accentFailure : theme.primary}`
      : `1px solid ${ warning ? theme.accentFailure : '#8E8E8E'}`};

  background: ${({ theme, active, warning }) => active ? '#632586' : 'transparent'};
  :hover {
    border: ${({ theme, active, warning }) =>
    active && `1px solid ${warning ? darken(0.1, theme.accentFailure) : darken(0.1, theme.accentAction)}`};
  }

  input {
    width: 100%;
    height: 100%;
    border: 0px;
    border-radius: 2rem;
  }
`

const SlippageEmojiContainer = styled.span`
  color: #f3841e;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: none;
  `}
`

const Button = styled.div`
  cursor: pointer;
  width: 100%;
  height: 33px;
  border-radius: 8px;
  background: ${({ theme }) => theme.primary};
  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 14px;
  font-weight: 500;
`

interface TransactionSettingsProps {
  placeholderSlippage: Percent // varies according to the context in which the settings dialog is placed
}

const THREE_DAYS_IN_SECONDS = ms`3 days` / 1000

type Slippage = '0.10' | '0.50' | '1.00'

const SlippageArr: Slippage[] = ['0.10', '0.50', '1.00'];

export default function TransactionSettings({ placeholderSlippage }: TransactionSettingsProps) {
  const { chainId } = useWeb3React()
  const theme = useTheme()

  const [userSlippageTolerance, setUserSlippageTolerance] = useUserSlippageTolerance()

  const [deadline, setDeadline] = useUserTransactionTTL()

  const [slippageOption, setSlippageOption] = useState<Slippage | 'custom'>(userSlippageTolerance === 'auto' ? SlippageArr[0] : (userSlippageTolerance.toFixed(2) ?? SlippageArr[0]));
  const [slippageInput, setSlippageInput] = useState('')
  const [slippageError, setSlippageError] = useState<SlippageError | false>(false)

  const [deadlineInput, setDeadlineInput] = useState('')
  const [deadlineError, setDeadlineError] = useState<DeadlineError | false>(false)

  function parseSlippageInput(value: string) {
    // populate what the user typed and clear the error
    setSlippageInput(value);
    setSlippageError(false)
  }

  const tooLow = userSlippageTolerance !== 'auto' && userSlippageTolerance.lessThan(new Percent(5, 10_000))
  const tooHigh = userSlippageTolerance !== 'auto' && userSlippageTolerance.greaterThan(new Percent(1, 100))

  function parseCustomDeadline(value: string) {
    // populate what the user typed and clear the error
    setDeadlineInput(value)
    setDeadlineError(false)
  }

  const showCustomDeadlineRow = Boolean(chainId && !L2_CHAIN_IDS.includes(chainId))

  const handleSave = () => {
    const slippageVal = slippageOption === 'custom' ? slippageInput : slippageOption;
    const parsed = Math.floor(Number.parseFloat(slippageVal) * 100)

    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 5000) {
      setUserSlippageTolerance('auto')
      if (slippageVal !== '.') {
        setSlippageError(SlippageError.InvalidInput)
      }
    } else {
      setUserSlippageTolerance(new Percent(parsed, 10_000))
    }

    if (!showCustomDeadlineRow) return;

    if (deadlineInput.length === 0) {
      setDeadline(DEFAULT_DEADLINE_FROM_NOW)
    } else {
      try {
        const parsed: number = Math.floor(Number.parseFloat(deadlineInput) * 60)
        if (!Number.isInteger(parsed) || parsed < 60 || parsed > THREE_DAYS_IN_SECONDS) {
          setDeadlineError(DeadlineError.InvalidInput)
        } else {
          setDeadline(parsed)
        }
      } catch (error) {
        console.error(error)
        setDeadlineError(DeadlineError.InvalidInput)
      }
    }
  }

  return (
    <AutoColumn gap="md">
      <AutoColumn gap="sm">
        <RowFixed>
          <ThemedText.DeprecatedBlack fontWeight={500} fontSize={14} color={theme.title}>
            <Trans>Slippage Tolerance</Trans>
          </ThemedText.DeprecatedBlack>
          {/* <QuestionHelper
            text={
              <Trans>Your transaction will revert if the price changes unfavorably by more than this percentage.</Trans>
            }
          /> */}
        </RowFixed>
        <RowBetween>
          {
            SlippageArr.map(item => {
              return (
                <Option
                  key={item}
                  onClick={() => {
                    // parseSlippageInput(item)
                    setSlippageOption(item);
                  }}
                  active={slippageOption === item}
                >
                  <Trans>{`${item}%`}</Trans>
                </Option>
              )
            })
          }
          <OptionCustom active={slippageOption === 'custom'} warning={!!slippageError} tabIndex={-1}>
            <RowBetween>
              {tooLow || tooHigh ? (
                <SlippageEmojiContainer>
                  <span role="img" aria-label="warning">
                    ⚠️
                  </span>
                </SlippageEmojiContainer>
              ) : null}
              <Input
                placeholder={placeholderSlippage.toFixed(2)}
                value={
                  slippageInput.length > 0
                    ? slippageInput
                    : ''
                }
                onFocus={() => setSlippageOption('custom')}
                onChange={(e) => parseSlippageInput(e.target.value)}
                color={slippageError ? 'red' : ''}
              />
              %
            </RowBetween>
          </OptionCustom>
        </RowBetween>
        {slippageError || tooLow || tooHigh ? (
          <RowBetween
            style={{
              fontSize: '14px',
              paddingTop: '7px',
              color: slippageError ? 'red' : '#F3841E',
            }}
          >
            {slippageError ? (
              <Trans>Enter a valid slippage percentage</Trans>
            ) : tooLow ? (
              <Trans>Your transaction may fail</Trans>
            ) : (
              <Trans>Your transaction may be frontrun</Trans>
            )}
          </RowBetween>
        ) : null}
      </AutoColumn>

      {showCustomDeadlineRow && (
        <AutoColumn gap="sm">
          <RowFixed>
            <ThemedText.DeprecatedBlack fontSize={14} fontWeight={500} color={theme.title}>
              <Trans>Tx Deadline (Mins)</Trans>
            </ThemedText.DeprecatedBlack>
            {/* <QuestionHelper
              text={<Trans>Your transaction will revert if it is pending for more than this period of time.</Trans>}
            /> */}
          </RowFixed>
          <RowFixed style={{ width: '100%' }}>
            <OptionCustom style={{ width: '100%' }} warning={!!deadlineError} tabIndex={-1}>
              <Input
                placeholder={(DEFAULT_DEADLINE_FROM_NOW / 60).toString()}
                value={
                  deadlineInput.length > 0
                    ? deadlineInput
                    : deadline === DEFAULT_DEADLINE_FROM_NOW
                      ? ''
                      : (deadline / 60).toString()
                }
                onChange={(e) => parseCustomDeadline(e.target.value)}
                color={deadlineError ? 'red' : ''}
                style={{
                  'textAlign': 'center'
                }}
              />
            </OptionCustom>
            {/* <ThemedText.DeprecatedBody style={{ paddingLeft: '8px' }} fontSize={14}>
              <Trans>minutes</Trans>
            </ThemedText.DeprecatedBody> */}
          </RowFixed>
        </AutoColumn>
      )}
      <Button onClick={handleSave}>Save</Button>
    </AutoColumn>
  )
}
