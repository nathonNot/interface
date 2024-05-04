import { Trans } from '@lingui/macro'
import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, SwapEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { useWeb3React } from '@web3-react/core'
import { AutoColumn } from 'components/Column'
import { LoadingOpacityContainer, loadingOpacityMixin } from 'components/Loader/styled'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { isSupportedChain } from 'constants/chains'
import { darken } from 'polished'
import { ReactNode, useCallback, useState } from 'react'
import { Lock } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { flexColumnNoWrap, flexRowNoWrap } from 'theme/styles'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import { useCurrencyBalance } from '../../state/connection/hooks'
import { ThemedText } from '../../theme'
import { ButtonGray } from '../Button'
import DoubleCurrencyLogo from '../DoubleLogo'
import { Input as NumericalInput } from '../NumericalInput'
import { RowBetween, RowFixed } from '../Row'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import { FiatValue } from './FiatValue'

const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${flexColumnNoWrap};
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '16px' : '20px')};
  z-index: 1;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  transition: height 1s ease;
  will-change: height;
`

const FixedContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`

const Container = styled.div<{ hideInput: boolean }>`
  min-height: 44px;
  border-radius: ${({ hideInput }) => (hideInput ? '16px' : '20px')};
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
`

const CurrencySelect = styled(ButtonGray) <{
  visible: boolean
  selected: boolean
  hideInput?: boolean
  disabled?: boolean
}>`
  align-items: center;
  // background-color: ${({ selected, theme }) => (selected ? theme.backgroundInteractive : theme.accentAction)};
  background: transparent;
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')};
  color: ${({ selected, theme }) => (selected ? theme.textPrimary : theme.white)};
  cursor: pointer;
  height: unset;
  border-radius: 16px;
  outline: none;
  user-select: none;
  border: none;
  font-size: 24px;
  font-weight: 400;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  padding: ${({ selected }) => (selected ? '4px 8px 4px 4px' : '6px 6px 6px 8px')};
  gap: 8px;
  justify-content: space-between;
  margin-left: ${({ hideInput }) => (hideInput ? '0' : '12px')};

  &:hover,
  &:active {
    // background-color: ${({ theme, selected }) => (selected ? theme.backgroundInteractive : theme.accentAction)};
    background: transparent;
  }

  &:before {
    background-size: 100%;
    border-radius: inherit;

    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
    content: '';
  }

  &:hover:before {
    // background-color: ${({ theme }) => theme.stateOverlayHover};
    background: transparent;
  }

  &:active:before {
    // background-color: ${({ theme }) => theme.stateOverlayPressed};
    background: transparent;
  }

  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
`

const InputRow = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  justify-content: space-between;
`

const LabelRow = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 0.75rem;
  line-height: 1rem;

  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.textSecondary)};
  }
`

const FiatRow = styled(LabelRow)`
  justify-content: flex-end;
  min-height: 20px;
  // padding: 8px 0px 0px 0px;
  padding: 0;
`

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const StyledDropDown = styled(DropDown) <{ selected: boolean }>`
  margin: 0 0.25rem 0 0.35rem;
  height: 35%;
  margin-left: 8px;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.textPrimary : theme.white)};
    stroke-width: 2px;
  }
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.25rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size: 20px;
  font-weight: 600;
`

const StyledBalanceMax = styled.button<{ disabled?: boolean }>`
  background-color: transparent;
  border: none;
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  padding: 4px 6px;
  pointer-events: ${({ disabled }) => (!disabled ? 'initial' : 'none')};

  :hover {
    opacity: ${({ disabled }) => (!disabled ? 0.8 : 0.4)};
  }

  :focus {
    outline: none;
  }
`

const StyledNumericalInput = styled(NumericalInput) <{ $loading: boolean }>`
  ${loadingOpacityMixin};
  text-align: left;
  font-size: 24px;
  font-weight: 600;
  // line-height: 44px;
  font-variant: small-caps;
`

const LabelContainer = styled.div`
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Label = styled.div`
  font-size: 18px;
  color: ${({ theme }) => theme.textDefault}
`

interface SwapCurrencyInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label?: ReactNode
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  fiatValue: { data?: number; isLoading: boolean }
  priceImpact?: Percent
  id: string
  showCommonBases?: boolean
  showCurrencyAmount?: boolean
  disableNonToken?: boolean
  renderBalance?: (amount: CurrencyAmount<Currency>) => ReactNode
  locked?: boolean
  loading?: boolean
}

export default function SwapCurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  onCurrencySelect,
  currency,
  otherCurrency,
  id,
  showCommonBases,
  showCurrencyAmount,
  disableNonToken,
  renderBalance,
  fiatValue,
  priceImpact,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  locked = false,
  loading = false,
  label = '',
  ...rest
}: SwapCurrencyInputPanelProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { account, chainId } = useWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const theme = useTheme()

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const chainAllowed = isSupportedChain(chainId)

  return (
    <InputPanel id={id} hideInput={hideInput} {...rest}>
      {locked && (
        <FixedContainer>
          <AutoColumn gap="sm" justify="center">
            <Lock />
            <ThemedText.DeprecatedLabel fontSize="12px" textAlign="center" padding="0 12px">
              <Trans>The market price is outside your specified price range. Single-asset deposit only.</Trans>
            </ThemedText.DeprecatedLabel>
          </AutoColumn>
        </FixedContainer>
      )}
      <Container hideInput={hideInput}>
        <LabelContainer>
          <Label>
            {label}
          </Label>
          {/* balance component */}
          {Boolean(!hideInput && !hideBalance) && (
            <FiatRow>
              <RowBetween>
                <LoadingOpacityContainer $loading={loading}>
                  <FiatValue fiatValue={fiatValue} priceImpact={priceImpact} />
                </LoadingOpacityContainer>
                {account ? (
                  <RowFixed style={{ height: '17px' }}>
                    <ThemedText.DeprecatedBody
                      color={'textDefault'}
                      style={{ display: 'inline' }}
                    >
                      {!hideBalance && currency && selectedCurrencyBalance ? (
                        renderBalance ? (
                          renderBalance(selectedCurrencyBalance)
                        ) : (
                          <Trans>Balance: {formatCurrencyAmount(selectedCurrencyBalance, 4)}</Trans>
                        )
                      ) : null}
                    </ThemedText.DeprecatedBody>

                  </RowFixed>
                ) : (
                  <span />
                )}
              </RowBetween>
            </FiatRow>
          )}
        </LabelContainer>
        <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}}>
          {!hideInput && (
            <StyledNumericalInput
              className="token-amount-input"
              value={value}
              onUserInput={onUserInput}
              disabled={!chainAllowed}
              $loading={loading}
              placeholder="Input"
            />
          )}
          {showMaxButton && selectedCurrencyBalance ? (
            <TraceEvent
              events={[BrowserEvent.onClick]}
              name={SwapEventName.SWAP_MAX_TOKEN_AMOUNT_SELECTED}
              element={InterfaceElementName.MAX_TOKEN_AMOUNT_BUTTON}
            >
              <StyledBalanceMax onClick={onMax}>
                <Trans>Max</Trans>
              </StyledBalanceMax>
            </TraceEvent>
          ) : null}

          <CurrencySelect
            disabled={!chainAllowed}
            visible={currency !== undefined}
            selected={!!currency}
            hideInput={hideInput}
            className="open-currency-select-button"
            onClick={() => {
              if (onCurrencySelect) {
                setModalOpen(true)
              }
            }}
          >
            <Aligner>
              <RowFixed>
                {pair ? (
                  <span style={{ marginRight: '0.5rem' }}>
                    <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={24} margin={true} />
                  </span>
                ) : currency ? (
                  <CurrencyLogo style={{ marginRight: '2px' }} currency={currency} size="24px" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect width="28" height="28" rx="14" fill="#BC42FF" />
                    <path d="M11.4286 10.8571C11.4286 9.51763 12.5176 8.42857 13.8571 8.42857H15.0714C16.4109 8.42857 17.5 9.51763 17.5 10.8571V10.9938C17.5 11.821 17.0788 12.5913 16.3844 13.0353L14.783 14.0636C14.3129 14.3659 13.9261 14.7814 13.6583 15.272C13.3904 15.7627 13.25 16.3127 13.25 16.8717V16.9286C13.25 17.6002 13.7926 18.1429 14.4643 18.1429C15.1359 18.1429 15.6786 17.6002 15.6786 16.9286V16.8754C15.6786 16.5643 15.8379 16.2759 16.096 16.1089L17.6973 15.0806C19.0862 14.185 19.9286 12.6482 19.9286 10.9938V10.8571C19.9286 8.17433 17.7542 6 15.0714 6H13.8571C11.1743 6 9 8.17433 9 10.8571C9 11.5288 9.54263 12.0714 10.2143 12.0714C10.8859 12.0714 11.4286 11.5288 11.4286 10.8571ZM14.4643 23C14.8668 23 15.2529 22.8401 15.5376 22.5554C15.8222 22.2708 15.9821 21.8847 15.9821 21.4821C15.9821 21.0796 15.8222 20.6935 15.5376 20.4089C15.2529 20.1242 14.8668 19.9643 14.4643 19.9643C14.0617 19.9643 13.6757 20.1242 13.391 20.4089C13.1063 20.6935 12.9464 21.0796 12.9464 21.4821C12.9464 21.8847 13.1063 22.2708 13.391 22.5554C13.6757 22.8401 14.0617 23 14.4643 23Z" fill="white" />
                  </svg>
                )}
                {pair ? (
                  <StyledTokenName className="pair-name-container">
                    {pair?.token0.symbol}:{pair?.token1.symbol}
                  </StyledTokenName>
                ) : (
                  <StyledTokenName className="token-symbol-container" active={Boolean(currency && currency.symbol)}>
                    {(currency && currency.symbol && currency.symbol.length > 20
                      ? currency.symbol.slice(0, 4) +
                      '...' +
                      currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                      : currency?.symbol) || <Trans>Select token</Trans>}
                  </StyledTokenName>
                )}
              </RowFixed>
              {onCurrencySelect && <StyledDropDown selected={!!currency} />}
            </Aligner>
          </CurrencySelect>
        </InputRow>

      </Container>
      {onCurrencySelect && (
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          showCommonBases={showCommonBases}
          showCurrencyAmount={showCurrencyAmount}
          disableNonToken={disableNonToken}
        />
      )}
    </InputPanel>
  )
}
