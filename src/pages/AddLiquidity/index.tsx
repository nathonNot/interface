import { BigNumber } from '@ethersproject/bignumber'
import type { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { FeeAmount, NonfungiblePositionManager } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import OwnershipWarning from 'components/addLiquidity/OwnershipWarning'
import { sendEvent } from 'components/analytics'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { isSupportedChain } from 'constants/chains'
import usePrevious from 'hooks/usePrevious'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { PositionPageUnsupportedContent } from 'pages/Pool/PositionPage'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft } from 'react-feather'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Text } from 'rebass'
import {
  useRangeHopCallbacks,
  useV3DerivedMintInfo,
  useV3MintActionHandlers,
  useV3MintState,
} from 'state/mint/v3/hooks'
import { useTheme } from 'styled-components/macro'
import { addressesAreEquivalent } from 'utils/addressesAreEquivalent'

import Button, { ButtonError, ButtonLight, ButtonPrimary, ButtonText } from '../../components/Button'
import Card, { BlueCard, OutlineCard, YellowCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from './CurrencyInputPanel'
import FeeSelector from '../../components/FeeSelector'
import HoverInlineText from '../../components/HoverInlineText'
import LiquidityChartRangeInput from '../../components/LiquidityChartRangeInput'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import { PositionPreview } from './PositionPreview'
import RangeSelector from '../../components/RangeSelector'
import PresetsButtons from '../../components/RangeSelector/PresetsButtons'
import RateToggle from '../../components/RateToggle'
import Row, { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from '../../constants/addresses'
import { ZERO_PERCENT } from '../../constants/misc'
import { WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { useArgentWalletContract } from '../../hooks/useArgentWalletContract'
import { useV3NFTPositionManagerContract } from '../../hooks/useContract'
import { useDerivedPositionInfo } from '../../hooks/useDerivedPositionInfo'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
import { useStablecoinValue } from '../../hooks/useStablecoinPrice'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { useV3PositionFromTokenId } from '../../hooks/useV3Positions'
import { Bound, Field } from '../../state/mint/v3/actions'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { TransactionType } from '../../state/transactions/types'
import { useIsExpertMode, useUserSlippageToleranceWithDefault } from '../../state/user/hooks'
import { BREAKPOINTS, ThemedText } from '../../theme'
import approveAmountCalldata from '../../utils/approveAmountCalldata'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import { currencyId } from '../../utils/currencyId'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { Dots } from '../Pool/styleds'
import { Review } from './Review'
import {
  CurrencyDropdown,
  DynamicSection,
  HideMedium,
  MediumOnly,
  ResponsiveTwoColumns,
  RightContainer,
  ScrollablePage,
  StackedContainer,
  StackedItem,
  Wrapper,
} from './styled'
import styled from 'styled-components'
import { BodyWrapper } from 'pages/AppBody'
import { Link as HistoryLink, useLocation } from 'react-router-dom'
import { useAppDispatch } from 'state/hooks'
import { resetMintState } from 'state/mint/actions'
import { resetMintState as resetMintV3State } from 'state/mint/v3/actions'
import PageTitle from 'components/PageTitle'
import BackBtn from 'components/BackBtn'
import ToggleButton from 'components/ToggleButton'
import { useIsMobile } from 'nft/hooks'
import { Column } from 'nft/components/Flex'
import { opacify } from 'theme/utils'
import Input from 'components/NumericalInput'

const TopContent = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
`

const PageWrapper = styled(BodyWrapper) <{ wide: boolean }>`
  // max-width: ${({ wide }) => (wide ? '880px' : '480px')};
  max-width: 880px;
  width: 100%;


  // padding: ${({ wide }) => (wide ? '10px' : '0')};

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    max-width: 480px;
  `};

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    max-width: 100%;
  }

  border: none;
  border-radius: 24px;
  background: ${({ theme }) => theme.main};
  margin-top: 0;

`

const ContentBox = styled.div<{ isMobile?: boolean }>`
  padding: ${({ isMobile }) => `24px ${isMobile ? 16 : 24}px`};
`

const PairBox = styled(ContentBox)`
  border-bottom: 1px solid #312E63;
`

const Label = styled(ThemedText.DeprecatedLabel)`
  color: #f4f4f4;
  font-size: 20px;
  line-height: 30px;
`

const NoLiquidityCard = styled(Card)`
  background: ${({ theme }) => opacify(24, theme.primary)};
  color: ${({ theme }) => theme.primary};
  border-radius: 12px;
`

const StyledInput = styled(Input)`
  text-align: left;
  font-size: 18px;
  width: 100%;
`

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

export default function AddLiquidityWrapper() {
  const { chainId } = useWeb3React()
  if (isSupportedChain(chainId)) {
    return <AddLiquidity />
  } else {
    return <PositionPageUnsupportedContent />
  }
}

function AddLiquidity() {
  const navigate = useNavigate()
  const {
    currencyIdA,
    currencyIdB,
    feeAmount: feeAmountFromUrl,
    tokenId,
  } = useParams<{ currencyIdA?: string; currencyIdB?: string; feeAmount?: string; tokenId?: string }>()
  const { account, chainId, provider } = useWeb3React()
  const theme = useTheme()

  const toggleWalletDrawer = useToggleAccountDrawer() // toggle wallet when disconnected
  const expertMode = useIsExpertMode()
  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()

  const dispatch = useAppDispatch()
  const location = useLocation()
  const isMobile = useIsMobile();

  // detect if back should redirect to v3 or v2 pool page
  const poolLink = location.pathname.includes('add/v2')
    ? '/pools/v2'
    : '/pools' + (tokenId ? `/${tokenId.toString()}` : '')

  // check for existing position if tokenId in url
  const { position: existingPositionDetails, loading: positionLoading } = useV3PositionFromTokenId(
    tokenId ? BigNumber.from(tokenId) : undefined
  )
  const hasExistingPosition = !!existingPositionDetails && !positionLoading
  const { position: existingPosition } = useDerivedPositionInfo(existingPositionDetails)

  // fee selection from url
  const feeAmount: FeeAmount | undefined =
    feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
      ? parseFloat(feeAmountFromUrl)
      : undefined

  const baseCurrency = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  // prevent an error if they input ETH/WETH
  const quoteCurrency =
    baseCurrency && currencyB && baseCurrency.wrapped.equals(currencyB.wrapped) ? undefined : currencyB

  // mint state
  const { independentField, typedValue, startPriceTypedValue } = useV3MintState()

  const {
    pool,
    ticks,
    dependentField,
    price,
    pricesAtTicks,
    pricesAtLimit,
    parsedAmounts,
    currencyBalances,
    position,
    noLiquidity,
    currencies,
    errorMessage,
    invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    invertPrice,
    ticksAtLimit,
  } = useV3DerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    existingPosition
  )

  const { onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput, onStartPriceInput } =
    useV3MintActionHandlers(noLiquidity)

  const isValid = !errorMessage && !invalidRange

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings

  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const usdcValues = {
    [Field.CURRENCY_A]: useStablecoinValue(parsedAmounts[Field.CURRENCY_A]),
    [Field.CURRENCY_B]: useStablecoinValue(parsedAmounts[Field.CURRENCY_B]),
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      }
    },
    {}
  )

  const atMaxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      }
    },
    {}
  )

  const argentWalletContract = useArgentWalletContract()

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_A],
    chainId ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_B],
    chainId ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined
  )

  const allowedSlippage = useUserSlippageToleranceWithDefault(
    outOfRange ? ZERO_PERCENT : DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE
  )

  async function onAdd() {
    if (!chainId || !provider || !account) return

    if (!positionManager || !baseCurrency || !quoteCurrency) {
      return
    }

    if (position && account && deadline) {
      const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined
      const { calldata, value } =
        hasExistingPosition && tokenId
          ? NonfungiblePositionManager.addCallParameters(position, {
            tokenId,
            slippageTolerance: allowedSlippage,
            deadline: deadline.toString(),
            useNative,
          })
          : NonfungiblePositionManager.addCallParameters(position, {
            slippageTolerance: allowedSlippage,
            recipient: account,
            deadline: deadline.toString(),
            useNative,
            createPool: noLiquidity,
          })

      let txn: { to: string; data: string; value: string } = {
        to: NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId],
        data: calldata,
        value,
      }

      if (argentWalletContract) {
        const amountA = parsedAmounts[Field.CURRENCY_A]
        const amountB = parsedAmounts[Field.CURRENCY_B]
        const batch = [
          ...(amountA && amountA.currency.isToken
            ? [approveAmountCalldata(amountA, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId])]
            : []),
          ...(amountB && amountB.currency.isToken
            ? [approveAmountCalldata(amountB, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId])]
            : []),
          {
            to: txn.to,
            data: txn.data,
            value: txn.value,
          },
        ]
        const data = argentWalletContract.interface.encodeFunctionData('wc_multiCall', [batch])
        txn = {
          to: argentWalletContract.address,
          data,
          value: '0x0',
        }
      }

      setAttemptingTxn(true)

      provider
        .getSigner()
        .estimateGas(txn)
        .then((estimate) => {
          const newTxn = {
            ...txn,
            gasLimit: calculateGasMargin(estimate),
          }

          return provider
            .getSigner()
            .sendTransaction(newTxn)
            .then((response: TransactionResponse) => {
              setAttemptingTxn(false)
              addTransaction(response, {
                type: TransactionType.ADD_LIQUIDITY_V3_POOL,
                baseCurrencyId: currencyId(baseCurrency),
                quoteCurrencyId: currencyId(quoteCurrency),
                createPool: Boolean(noLiquidity),
                expectedAmountBaseRaw: parsedAmounts[Field.CURRENCY_A]?.quotient?.toString() ?? '0',
                expectedAmountQuoteRaw: parsedAmounts[Field.CURRENCY_B]?.quotient?.toString() ?? '0',
                feeAmount: position.pool.fee,
              })
              setTxHash(response.hash)
              sendEvent({
                category: 'Liquidity',
                action: 'Add',
                label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/'),
              })
            })
        })
        .catch((error) => {
          console.error('Failed to send transaction', error)
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          if (error?.code !== 4001) {
            console.error(error)
          }
        })
    } else {
      return
    }
  }

  const handleCurrencySelect = useCallback(
    (currencyNew: Currency, currencyIdOther?: string): (string | undefined)[] => {
      const currencyIdNew = currencyId(currencyNew)

      if (currencyIdNew === currencyIdOther) {
        // not ideal, but for now clobber the other if the currency ids are equal
        return [currencyIdNew, undefined]
      } else {
        // prevent weth + eth
        const isETHOrWETHNew =
          currencyIdNew === 'ETH' ||
          (chainId !== undefined && currencyIdNew === WRAPPED_NATIVE_CURRENCY[chainId]?.address)
        const isETHOrWETHOther =
          currencyIdOther !== undefined &&
          (currencyIdOther === 'ETH' ||
            (chainId !== undefined && currencyIdOther === WRAPPED_NATIVE_CURRENCY[chainId]?.address))

        if (isETHOrWETHNew && isETHOrWETHOther) {
          return [currencyIdNew, undefined]
        } else {
          return [currencyIdNew, currencyIdOther]
        }
      }
    },
    [chainId]
  )

  const handleCurrencyASelect = useCallback(
    (currencyANew: Currency) => {
      const [idA, idB] = handleCurrencySelect(currencyANew, currencyIdB)
      if (idB === undefined) {
        navigate(`/add/${idA}`)
      } else {
        navigate(`/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdB, navigate]
  )

  const handleCurrencyBSelect = useCallback(
    (currencyBNew: Currency) => {
      const [idB, idA] = handleCurrencySelect(currencyBNew, currencyIdA)
      if (idA === undefined) {
        navigate(`/add/${idB}`)
      } else {
        navigate(`/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdA, navigate]
  )

  const handleFeePoolSelect = useCallback(
    (newFeeAmount: FeeAmount) => {
      onLeftRangeInput('')
      onRightRangeInput('')
      navigate(`/add/${currencyIdA}/${currencyIdB}/${newFeeAmount}`)
    },
    [currencyIdA, currencyIdB, navigate, onLeftRangeInput, onRightRangeInput]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
      // dont jump to pool page if creating
      navigate('/pools')
    }
    setTxHash('')
  }, [navigate, onFieldAInput, txHash])

  const addIsUnsupported = useIsSwapUnsupported(currencies?.CURRENCY_A, currencies?.CURRENCY_B)

  const clearAll = useCallback(() => {
    onFieldAInput('')
    onFieldBInput('')
    onLeftRangeInput('')
    onRightRangeInput('')
    navigate(`/add`)
  }, [navigate, onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput])

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetFullRange } =
    useRangeHopCallbacks(baseCurrency ?? undefined, quoteCurrency ?? undefined, feeAmount, tickLower, tickUpper, pool)

  // we need an existence check on parsed amounts for single-asset deposits
  const showApprovalA =
    !argentWalletContract && approvalA !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_A]
  const showApprovalB =
    !argentWalletContract && approvalB !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_B]

  const pendingText = `Supplying ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : ''} ${!depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
    } ${!outOfRange ? 'and' : ''} ${!depositBDisabled ? parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) : ''} ${!depositBDisabled ? currencies[Field.CURRENCY_B]?.symbol : ''
    }`

  const [searchParams, setSearchParams] = useSearchParams()

  const handleSetFullRange = useCallback(() => {
    getSetFullRange()

    const minPrice = pricesAtLimit[Bound.LOWER]
    if (minPrice) searchParams.set('minPrice', minPrice.toSignificant(5))
    const maxPrice = pricesAtLimit[Bound.UPPER]
    if (maxPrice) searchParams.set('maxPrice', maxPrice.toSignificant(5))
    setSearchParams(searchParams)

    sendEvent({
      category: 'Liquidity',
      action: 'Full Range Clicked',
    })
  }, [getSetFullRange, pricesAtLimit, searchParams, setSearchParams])

  // START: sync values with query string
  const oldSearchParams = usePrevious(searchParams)
  // use query string as an input to onInput handlers
  useEffect(() => {
    const minPrice = searchParams.get('minPrice')
    const oldMinPrice = oldSearchParams?.get('minPrice')
    if (
      minPrice &&
      typeof minPrice === 'string' &&
      !isNaN(minPrice as any) &&
      (!oldMinPrice || oldMinPrice !== minPrice)
    ) {
      onLeftRangeInput(minPrice)
    }
    // disable eslint rule because this hook only cares about the url->input state data flow
    // input state -> url updates are handled in the input handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  useEffect(() => {
    const maxPrice = searchParams.get('maxPrice')
    const oldMaxPrice = oldSearchParams?.get('maxPrice')
    if (
      maxPrice &&
      typeof maxPrice === 'string' &&
      !isNaN(maxPrice as any) &&
      (!oldMaxPrice || oldMaxPrice !== maxPrice)
    ) {
      onRightRangeInput(maxPrice)
    }
    // disable eslint rule because this hook only cares about the url->input state data flow
    // input state -> url updates are handled in the input handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  // END: sync values with query string

  const Buttons = () =>
    addIsUnsupported ? (
      <ButtonPrimary disabled={true} $borderRadius="12px" padding="12px">
        <ThemedText.DeprecatedMain mb="4px">
          <Trans>Unsupported Asset</Trans>
        </ThemedText.DeprecatedMain>
      </ButtonPrimary>
    ) : !account ? (
      <TraceEvent
        events={[BrowserEvent.onClick]}
        name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
        properties={{ received_swap_quote: false }}
        element={InterfaceElementName.CONNECT_WALLET_BUTTON}
      >
        <ButtonPrimary onClick={toggleWalletDrawer} $borderRadius="12px" padding="12px">
          <Trans>Connect Wallet</Trans>
        </ButtonPrimary>
      </TraceEvent>
    ) : (
      <AutoColumn gap="md">
        {(approvalA === ApprovalState.NOT_APPROVED ||
          approvalA === ApprovalState.PENDING ||
          approvalB === ApprovalState.NOT_APPROVED ||
          approvalB === ApprovalState.PENDING) &&
          isValid && (
            <RowBetween>
              {showApprovalA && (
                <ButtonPrimary
                  onClick={approveACallback}
                  disabled={approvalA === ApprovalState.PENDING}
                  width={showApprovalB ? '48%' : '100%'}
                >
                  {approvalA === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans>Approving {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                  )}
                </ButtonPrimary>
              )}
              {showApprovalB && (
                <ButtonPrimary
                  onClick={approveBCallback}
                  disabled={approvalB === ApprovalState.PENDING}
                  width={showApprovalA ? '48%' : '100%'}
                >
                  {approvalB === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans>Approving {currencies[Field.CURRENCY_B]?.symbol}</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve {currencies[Field.CURRENCY_B]?.symbol}</Trans>
                  )}
                </ButtonPrimary>
              )}
            </RowBetween>
          )}
        {/* {
          (
            !isValid ||
            (!argentWalletContract && approvalA !== ApprovalState.APPROVED && !depositADisabled) ||
            (!argentWalletContract && approvalB !== ApprovalState.APPROVED && !depositBDisabled)

          ) ? (<></>) : (
            <ButtonError
              onClick={() => {
                expertMode ? onAdd() : setShowConfirm(true)
              }}
              error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
            >
              <Text fontWeight={500}>{errorMessage ? errorMessage : <Trans>Preview</Trans>}</Text>
            </ButtonError>
          )
        } */}
        <ButtonError
          onClick={() => {
            expertMode ? onAdd() : setShowConfirm(true)
          }}
          disabled={(
            !isValid ||
            (!argentWalletContract && approvalA !== ApprovalState.APPROVED && !depositADisabled) ||
            (!argentWalletContract && approvalB !== ApprovalState.APPROVED && !depositBDisabled)
          )}
          error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
        >
          <Text fontWeight={500}>{errorMessage ? errorMessage : <Trans>Preview</Trans>}</Text>
        </ButtonError>
      </AutoColumn>
    )

  const usdcValueCurrencyA = usdcValues[Field.CURRENCY_A]
  const usdcValueCurrencyB = usdcValues[Field.CURRENCY_B]
  const currencyAFiat = useMemo(
    () => ({
      data: usdcValueCurrencyA ? parseFloat(usdcValueCurrencyA.toSignificant()) : undefined,
      isLoading: false,
    }),
    [usdcValueCurrencyA]
  )
  const currencyBFiat = useMemo(
    () => ({
      data: usdcValueCurrencyB ? parseFloat(usdcValueCurrencyB.toSignificant()) : undefined,
      isLoading: false,
    }),
    [usdcValueCurrencyB]
  )

  const owner = useSingleCallResult(tokenId ? positionManager : null, 'ownerOf', [tokenId]).result?.[0]
  const ownsNFT =
    addressesAreEquivalent(owner, account) || addressesAreEquivalent(existingPositionDetails?.operator, account)
  const showOwnershipWarning = Boolean(hasExistingPosition && account && !ownsNFT)

  if (isMobile) {
    return (
      <>
        <ScrollablePage>
          <AutoColumn gap={`16px`}>
            <BackBtn
              text='Back'
              to={poolLink}
              onClick={() => {
                // not 100% sure both of these are needed
                dispatch(resetMintState())
                dispatch(resetMintV3State())
              }}
            />
            <PageTitle
              title='Add Pools'
              desc='Search and find the best asset'
            />
            <PageWrapper wide={!hasExistingPosition}>
              <Wrapper>
                <ResponsiveTwoColumns wide={!hasExistingPosition}>
                  <AutoColumn>
                    {!hasExistingPosition && (
                      <PairBox isMobile={isMobile}>
                        <AutoColumn gap="16px">
                          <RowBetween paddingBottom="20px">
                            <Label>
                              <Trans>Select Pair</Trans>
                            </Label>
                          </RowBetween>
                          <RowBetween gap='19px'>
                            <CurrencyDropdown
                              value={formattedAmounts[Field.CURRENCY_A]}
                              onUserInput={onFieldAInput}
                              hideInput={true}
                              onMax={() => {
                                onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                              }}
                              onCurrencySelect={handleCurrencyASelect}
                              showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                              currency={currencies[Field.CURRENCY_A] ?? null}
                              id="add-liquidity-input-tokena"
                              showCommonBases
                            />

                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none">
                              <g id="Group">
                                <path id="Vector" d="M11 20C11 20.3978 11.158 20.7794 11.4393 21.0607C11.7206 21.342 12.1022 21.5 12.5 21.5C12.8978 21.5 13.2794 21.342 13.5607 21.0607C13.842 20.7794 14 20.3978 14 20V13.5H20.5C20.8978 13.5 21.2794 13.342 21.5607 13.0607C21.842 12.7794 22 12.3978 22 12C22 11.6022 21.842 11.2206 21.5607 10.9393C21.2794 10.658 20.8978 10.5 20.5 10.5H14V4C14 3.60218 13.842 3.22064 13.5607 2.93934C13.2794 2.65804 12.8978 2.5 12.5 2.5C12.1022 2.5 11.7206 2.65804 11.4393 2.93934C11.158 3.22064 11 3.60218 11 4V10.5H4.5C4.10218 10.5 3.72064 10.658 3.43934 10.9393C3.15804 11.2206 3 11.6022 3 12C3 12.3978 3.15804 12.7794 3.43934 13.0607C3.72064 13.342 4.10218 13.5 4.5 13.5H11V20Z" fill="#E4E4E5" />
                              </g>
                            </svg>

                            <CurrencyDropdown
                              value={formattedAmounts[Field.CURRENCY_B]}
                              hideInput={true}
                              onUserInput={onFieldBInput}
                              onCurrencySelect={handleCurrencyBSelect}
                              onMax={() => {
                                onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                              }}
                              showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                              currency={currencies[Field.CURRENCY_B] ?? null}
                              id="add-liquidity-input-tokenb"
                              showCommonBases
                            />
                          </RowBetween>

                          <FeeSelector
                            disabled={!quoteCurrency || !baseCurrency}
                            feeAmount={feeAmount}
                            handleFeePoolSelect={handleFeePoolSelect}
                            currencyA={baseCurrency ?? undefined}
                            currencyB={quoteCurrency ?? undefined}
                          />
                        </AutoColumn>{' '}
                      </PairBox>
                    )}

                    {hasExistingPosition && existingPosition && (
                      <PairBox isMobile={isMobile}>
                        <PositionPreview
                          position={existingPosition}
                          title={<Trans>Selected Range</Trans>}
                          inRange={!outOfRange}
                          ticksAtLimit={ticksAtLimit}
                        />
                      </PairBox>
                    )}
                  </AutoColumn>
                  <ContentBox isMobile={isMobile}>
                    <DynamicSection
                      disabled={tickLower === undefined || tickUpper === undefined || invalidPool || invalidRange}
                    >
                      <AutoColumn gap="24px">
                        <Label>
                          {hasExistingPosition ? <Trans>Add more liquidity</Trans> : <Trans>Deposit Amounts</Trans>}
                        </Label>

                        <CurrencyInputPanel
                          value={formattedAmounts[Field.CURRENCY_A]}
                          onUserInput={onFieldAInput}
                          onMax={() => {
                            onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                          }}
                          showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                          currency={currencies[Field.CURRENCY_A] ?? null}
                          id="add-liquidity-input-tokena"
                          fiatValue={currencyAFiat}
                          showCommonBases
                          locked={depositADisabled}
                        />

                        <CurrencyInputPanel
                          value={formattedAmounts[Field.CURRENCY_B]}
                          onUserInput={onFieldBInput}
                          onMax={() => {
                            onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                          }}
                          showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                          fiatValue={currencyBFiat}
                          currency={currencies[Field.CURRENCY_B] ?? null}
                          id="add-liquidity-input-tokenb"
                          showCommonBases
                          locked={depositBDisabled}
                        />
                      </AutoColumn>
                    </DynamicSection>
                  </ContentBox>

                  <>
                    <RightContainer gap="16px" isMobile={isMobile}>
                      <DynamicSection gap="16px" disabled={!feeAmount || invalidPool}>
                        {!noLiquidity ? (
                          <>
                            <AutoColumn gap='12px'>
                              <Label>
                                <Trans>Set Price Range</Trans>
                              </Label>
                              {
                                quoteCurrency && (
                                  <ToggleButton
                                    text='Set Price In'
                                    onClick={() => {
                                      if (!ticksAtLimit[Bound.LOWER] && !ticksAtLimit[Bound.UPPER]) {
                                        onLeftRangeInput((invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? '')
                                        onRightRangeInput((invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? '')
                                        onFieldAInput(formattedAmounts[Field.CURRENCY_B] ?? '')
                                      }
                                      navigate(
                                        `/add/${currencyIdB as string}/${currencyIdA as string}${feeAmount ? '/' + feeAmount : ''}`
                                      )
                                    }}
                                    symbol={quoteCurrency.symbol!}
                                  />
                                )}
                            </AutoColumn>

                            {price && baseCurrency && quoteCurrency && !noLiquidity && (
                              <AutoRow gap="4px" justify="center" fontWeight={500}>
                                <Trans>
                                  {
                                    `Current Price: 1 ${baseCurrency.symbol} = ${<HoverInlineText
                                      maxCharacters={20}
                                      text={invertPrice ? price.invert().toSignificant(6) : price.toSignificant(6)}
                                    />
                                    } ${quoteCurrency?.symbol}`
                                  }
                                </Trans>
                              </AutoRow>
                            )}

                            <LiquidityChartRangeInput
                              currencyA={baseCurrency ?? undefined}
                              currencyB={quoteCurrency ?? undefined}
                              feeAmount={feeAmount}
                              ticksAtLimit={ticksAtLimit}
                              price={
                                price ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8)) : undefined
                              }
                              priceLower={priceLower}
                              priceUpper={priceUpper}
                              onLeftRangeInput={onLeftRangeInput}
                              onRightRangeInput={onRightRangeInput}
                              interactive={!hasExistingPosition}
                            />
                          </>
                        ) : (
                          <AutoColumn gap="md">
                            <RowBetween>
                              <Label>
                                <Trans>Set Starting Price</Trans>
                              </Label>
                            </RowBetween>
                            {noLiquidity && (
                              <NoLiquidityCard
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  padding: '1rem 1rem',
                                }}
                              >
                                <ThemedText.DeprecatedBody
                                  fontSize={14}
                                  style={{ fontWeight: 500 }}
                                  textAlign="left"
                                  color={theme.primary}
                                >
                                  <Trans>
                                    This pool must be initialized before you can add liquidity. To initialize, select a
                                    starting price for the pool. Then, enter your liquidity price range and deposit
                                    amount. Gas fees will be higher than usual due to the initialization transaction.
                                  </Trans>
                                </ThemedText.DeprecatedBody>
                              </NoLiquidityCard>
                            )}
                            <OutlineCard padding="12px">
                              <StyledInput
                                className="start-price-input"
                                value={startPriceTypedValue}
                                onUserInput={onStartPriceInput}
                              />
                            </OutlineCard>
                            <RowBetween
                              style={{ backgroundColor: theme.deprecated_bg1, padding: '12px', borderRadius: '12px' }}
                            >
                              <ThemedText.DeprecatedMain>
                                <Trans>Current {baseCurrency?.symbol} Price:</Trans>
                              </ThemedText.DeprecatedMain>
                              <ThemedText.DeprecatedMain>
                                {price ? (
                                  <ThemedText.DeprecatedMain>
                                    <RowFixed>
                                      <HoverInlineText
                                        maxCharacters={20}
                                        text={invertPrice ? price?.invert()?.toSignificant(5) : price?.toSignificant(5)}
                                      />{' '}
                                      <span style={{ marginLeft: '4px' }}>{quoteCurrency?.symbol}</span>
                                    </RowFixed>
                                  </ThemedText.DeprecatedMain>
                                ) : (
                                  '-'
                                )}
                              </ThemedText.DeprecatedMain>
                            </RowBetween>
                          </AutoColumn>
                        )}
                      </DynamicSection>

                      <DynamicSection
                        gap="16px"
                        disabled={!feeAmount || invalidPool || (noLiquidity && !startPriceTypedValue)}
                      >
                        <StackedContainer>
                          <StackedItem>
                            <AutoColumn gap="16px">
                              {noLiquidity && (
                                <RowBetween>
                                  <Label>
                                    <Trans>Set Price Range</Trans>
                                  </Label>
                                </RowBetween>
                              )}
                              <RangeSelector
                                priceLower={priceLower}
                                priceUpper={priceUpper}
                                getDecrementLower={getDecrementLower}
                                getIncrementLower={getIncrementLower}
                                getDecrementUpper={getDecrementUpper}
                                getIncrementUpper={getIncrementUpper}
                                onLeftRangeInput={onLeftRangeInput}
                                onRightRangeInput={onRightRangeInput}
                                currencyA={baseCurrency}
                                currencyB={quoteCurrency}
                                feeAmount={feeAmount}
                                ticksAtLimit={ticksAtLimit}
                              />
                              {!noLiquidity && <PresetsButtons onSetFullRange={handleSetFullRange} />}
                            </AutoColumn>
                          </StackedItem>
                        </StackedContainer>

                        {outOfRange ? (
                          <YellowCard padding="8px 12px" $borderRadius="12px">
                            <RowBetween>
                              <AlertTriangle stroke={theme.deprecated_yellow3} size="16px" />
                              <ThemedText.DeprecatedYellow ml="12px" fontSize="12px">
                                <Trans>
                                  Your position will not earn fees or be used in trades until the market price moves into
                                  your range.
                                </Trans>
                              </ThemedText.DeprecatedYellow>
                            </RowBetween>
                          </YellowCard>
                        ) : null}

                        {invalidRange ? (
                          <YellowCard padding="8px 12px" $borderRadius="12px">
                            <RowBetween>
                              <AlertTriangle stroke={theme.deprecated_yellow3} size="16px" />
                              <ThemedText.DeprecatedYellow ml="12px" fontSize="12px">
                                <Trans>Invalid range selected. The min price must be lower than the max price.</Trans>
                              </ThemedText.DeprecatedYellow>
                            </RowBetween>
                          </YellowCard>
                        ) : null}
                      </DynamicSection>
                    </RightContainer>
                  </>

                </ResponsiveTwoColumns>
              </Wrapper>
            </PageWrapper>
            <Buttons />
            {showOwnershipWarning && <OwnershipWarning ownerAddress={owner} />}
            {addIsUnsupported && (
              <UnsupportedCurrencyFooter
                show={addIsUnsupported}
                currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]}
              />
            )}
          </AutoColumn>



          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash}
            content={() => (
              <ConfirmationModalContent
                title={<Trans>Overview</Trans>}
                onDismiss={handleDismissConfirmation}
                isMobile={isMobile}
                topContent={() => (
                  <Review
                    parsedAmounts={parsedAmounts}
                    position={position}
                    existingPosition={existingPosition}
                    priceLower={priceLower}
                    priceUpper={priceUpper}
                    outOfRange={outOfRange}
                    ticksAtLimit={ticksAtLimit}
                  />
                )}
                bottomContent={() => (
                  <ButtonPrimary style={{ marginTop: '1rem' }} onClick={onAdd}>
                    <Text fontWeight={500} fontSize={20}>
                      <Trans>Add</Trans>
                    </Text>
                  </ButtonPrimary>
                )}
              />
            )}
            pendingText={pendingText}
          />

        </ScrollablePage>
        <SwitchLocaleLink />
      </>
    )
  }
  return (
    <>
      <ScrollablePage>
        <AutoColumn gap={`${isMobile ? 16 : 32}px`}>
          {
            isMobile ? (
              <>
                <BackBtn
                  text='Back'
                  to={poolLink}
                  onClick={() => {
                    // not 100% sure both of these are needed
                    dispatch(resetMintState())
                    dispatch(resetMintV3State())
                  }}
                />
                <PageTitle
                  title='Add Pools'
                  desc='Search and find the best asset'
                />
              </>
            ) : (
              <TopContent>
                <BackBtn
                  text='Back'
                  to={poolLink}
                  onClick={() => {
                    // not 100% sure both of these are needed
                    dispatch(resetMintState())
                    dispatch(resetMintV3State())
                  }}
                  style={{
                    position: 'absolute',
                    left: '0',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
                <PageTitle
                  title='Add Pools'
                  desc='Search and find the best asset'
                  center='center'
                />
              </TopContent>
            )
          }
          <PageWrapper wide={!hasExistingPosition}>
            <Wrapper>
              <ResponsiveTwoColumns wide={!hasExistingPosition}>
                <AutoColumn>
                  {!hasExistingPosition && (
                    <PairBox>
                      <AutoColumn gap="24px">
                        <RowBetween paddingBottom="20px">
                          <Label>
                            <Trans>Select Pair</Trans>
                          </Label>
                        </RowBetween>
                        <RowBetween gap='19px'>
                          <CurrencyDropdown
                            value={formattedAmounts[Field.CURRENCY_A]}
                            onUserInput={onFieldAInput}
                            hideInput={true}
                            onMax={() => {
                              onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                            }}
                            onCurrencySelect={handleCurrencyASelect}
                            showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                            currency={currencies[Field.CURRENCY_A] ?? null}
                            id="add-liquidity-input-tokena"
                            showCommonBases
                          />

                          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none">
                            <g id="Group">
                              <path id="Vector" d="M11 20C11 20.3978 11.158 20.7794 11.4393 21.0607C11.7206 21.342 12.1022 21.5 12.5 21.5C12.8978 21.5 13.2794 21.342 13.5607 21.0607C13.842 20.7794 14 20.3978 14 20V13.5H20.5C20.8978 13.5 21.2794 13.342 21.5607 13.0607C21.842 12.7794 22 12.3978 22 12C22 11.6022 21.842 11.2206 21.5607 10.9393C21.2794 10.658 20.8978 10.5 20.5 10.5H14V4C14 3.60218 13.842 3.22064 13.5607 2.93934C13.2794 2.65804 12.8978 2.5 12.5 2.5C12.1022 2.5 11.7206 2.65804 11.4393 2.93934C11.158 3.22064 11 3.60218 11 4V10.5H4.5C4.10218 10.5 3.72064 10.658 3.43934 10.9393C3.15804 11.2206 3 11.6022 3 12C3 12.3978 3.15804 12.7794 3.43934 13.0607C3.72064 13.342 4.10218 13.5 4.5 13.5H11V20Z" fill="#E4E4E5" />
                            </g>
                          </svg>

                          <CurrencyDropdown
                            value={formattedAmounts[Field.CURRENCY_B]}
                            hideInput={true}
                            onUserInput={onFieldBInput}
                            onCurrencySelect={handleCurrencyBSelect}
                            onMax={() => {
                              onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                            }}
                            showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                            currency={currencies[Field.CURRENCY_B] ?? null}
                            id="add-liquidity-input-tokenb"
                            showCommonBases
                          />
                        </RowBetween>

                        <FeeSelector
                          disabled={!quoteCurrency || !baseCurrency}
                          feeAmount={feeAmount}
                          handleFeePoolSelect={handleFeePoolSelect}
                          currencyA={baseCurrency ?? undefined}
                          currencyB={quoteCurrency ?? undefined}
                        />
                      </AutoColumn>{' '}
                    </PairBox>
                  )}

                  {hasExistingPosition && existingPosition && (
                    <PairBox>
                      <PositionPreview
                        position={existingPosition}
                        title={<Trans>Selected Range</Trans>}
                        inRange={!outOfRange}
                        ticksAtLimit={ticksAtLimit}
                      />
                    </PairBox>
                  )}
                </AutoColumn>
                <ContentBox>
                  <DynamicSection
                    disabled={tickLower === undefined || tickUpper === undefined || invalidPool || invalidRange}
                  >
                    <AutoColumn gap="24px">
                      <Label>
                        {hasExistingPosition ? <Trans>Add more liquidity</Trans> : <Trans>Deposit Amounts</Trans>}
                      </Label>

                      <CurrencyInputPanel
                        value={formattedAmounts[Field.CURRENCY_A]}
                        onUserInput={onFieldAInput}
                        onMax={() => {
                          onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                        }}
                        showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                        currency={currencies[Field.CURRENCY_A] ?? null}
                        id="add-liquidity-input-tokena"
                        fiatValue={currencyAFiat}
                        showCommonBases
                        locked={depositADisabled}
                      />

                      <CurrencyInputPanel
                        value={formattedAmounts[Field.CURRENCY_B]}
                        onUserInput={onFieldBInput}
                        onMax={() => {
                          onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                        }}
                        showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                        fiatValue={currencyBFiat}
                        currency={currencies[Field.CURRENCY_B] ?? null}
                        id="add-liquidity-input-tokenb"
                        showCommonBases
                        locked={depositBDisabled}
                      />
                    </AutoColumn>
                  </DynamicSection>
                </ContentBox>

                <>
                  <RightContainer gap="lg">
                    <DynamicSection gap="24px" disabled={!feeAmount || invalidPool}>
                      {!noLiquidity ? (
                        <>
                          <RowBetween>
                            <Label>
                              <Trans>Set Price Range</Trans>
                            </Label>
                            {
                              quoteCurrency && (
                                <ToggleButton
                                  text='Set Price In'
                                  onClick={() => {
                                    if (!ticksAtLimit[Bound.LOWER] && !ticksAtLimit[Bound.UPPER]) {
                                      onLeftRangeInput((invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? '')
                                      onRightRangeInput((invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? '')
                                      onFieldAInput(formattedAmounts[Field.CURRENCY_B] ?? '')
                                    }
                                    navigate(
                                      `/add/${currencyIdB as string}/${currencyIdA as string}${feeAmount ? '/' + feeAmount : ''}`
                                    )
                                  }}
                                  symbol={quoteCurrency.symbol!}
                                />
                              )}
                          </RowBetween>

                          {price && baseCurrency && quoteCurrency && !noLiquidity && (
                            <AutoRow gap="4px" justify="center" fontWeight={500}>
                              <Trans>
                                {
                                  `Current Price: 1 ${baseCurrency.symbol} = ${<HoverInlineText
                                    maxCharacters={20}
                                    text={invertPrice ? price.invert().toSignificant(6) : price.toSignificant(6)}
                                  />
                                  } ${quoteCurrency?.symbol}`
                                }
                              </Trans>
                            </AutoRow>
                          )}

                          <LiquidityChartRangeInput
                            currencyA={baseCurrency ?? undefined}
                            currencyB={quoteCurrency ?? undefined}
                            feeAmount={feeAmount}
                            ticksAtLimit={ticksAtLimit}
                            price={
                              price ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8)) : undefined
                            }
                            priceLower={priceLower}
                            priceUpper={priceUpper}
                            onLeftRangeInput={onLeftRangeInput}
                            onRightRangeInput={onRightRangeInput}
                            interactive={!hasExistingPosition}
                          />
                        </>
                      ) : (
                        <AutoColumn gap="md">
                          <RowBetween>
                            <Label>
                              <Trans>Set Starting Price</Trans>
                            </Label>
                          </RowBetween>
                          {noLiquidity && (
                            <NoLiquidityCard
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: '1rem 1rem',
                              }}
                            >
                              <ThemedText.DeprecatedBody
                                fontSize={14}
                                style={{ fontWeight: 500 }}
                                textAlign="left"
                                color={theme.primary}
                              >
                                <Trans>
                                  This pool must be initialized before you can add liquidity. To initialize, select a
                                  starting price for the pool. Then, enter your liquidity price range and deposit
                                  amount. Gas fees will be higher than usual due to the initialization transaction.
                                </Trans>
                              </ThemedText.DeprecatedBody>
                            </NoLiquidityCard>
                          )}
                          <OutlineCard padding="12px">
                            <StyledInput
                              className="start-price-input"
                              value={startPriceTypedValue}
                              onUserInput={onStartPriceInput}
                            />
                          </OutlineCard>
                          <RowBetween
                            style={{ backgroundColor: theme.deprecated_bg1, padding: '12px', borderRadius: '12px' }}
                          >
                            <ThemedText.DeprecatedMain>
                              <Trans>Current {baseCurrency?.symbol} Price:</Trans>
                            </ThemedText.DeprecatedMain>
                            <ThemedText.DeprecatedMain>
                              {price ? (
                                <ThemedText.DeprecatedMain>
                                  <RowFixed>
                                    <HoverInlineText
                                      maxCharacters={20}
                                      text={invertPrice ? price?.invert()?.toSignificant(5) : price?.toSignificant(5)}
                                    />{' '}
                                    <span style={{ marginLeft: '4px' }}>{quoteCurrency?.symbol}</span>
                                  </RowFixed>
                                </ThemedText.DeprecatedMain>
                              ) : (
                                '-'
                              )}
                            </ThemedText.DeprecatedMain>
                          </RowBetween>
                        </AutoColumn>
                      )}
                    </DynamicSection>

                    <DynamicSection
                      gap="24px"
                      disabled={!feeAmount || invalidPool || (noLiquidity && !startPriceTypedValue)}
                    >
                      <StackedContainer>
                        <StackedItem>
                          <AutoColumn gap="24px">
                            {noLiquidity && (
                              <RowBetween>
                                <Label>
                                  <Trans>Set Price Range</Trans>
                                </Label>
                              </RowBetween>
                            )}
                            <RangeSelector
                              priceLower={priceLower}
                              priceUpper={priceUpper}
                              getDecrementLower={getDecrementLower}
                              getIncrementLower={getIncrementLower}
                              getDecrementUpper={getDecrementUpper}
                              getIncrementUpper={getIncrementUpper}
                              onLeftRangeInput={onLeftRangeInput}
                              onRightRangeInput={onRightRangeInput}
                              currencyA={baseCurrency}
                              currencyB={quoteCurrency}
                              feeAmount={feeAmount}
                              ticksAtLimit={ticksAtLimit}
                            />
                            {!noLiquidity && <PresetsButtons onSetFullRange={handleSetFullRange} />}
                          </AutoColumn>
                        </StackedItem>
                      </StackedContainer>

                      {outOfRange ? (
                        <YellowCard padding="8px 12px" $borderRadius="12px">
                          <RowBetween>
                            <AlertTriangle stroke={theme.deprecated_yellow3} size="16px" />
                            <ThemedText.DeprecatedYellow ml="12px" fontSize="12px">
                              <Trans>
                                Your position will not earn fees or be used in trades until the market price moves into
                                your range.
                              </Trans>
                            </ThemedText.DeprecatedYellow>
                          </RowBetween>
                        </YellowCard>
                      ) : null}

                      {invalidRange ? (
                        <YellowCard padding="8px 12px" $borderRadius="12px">
                          <RowBetween>
                            <AlertTriangle stroke={theme.deprecated_yellow3} size="16px" />
                            <ThemedText.DeprecatedYellow ml="12px" fontSize="12px">
                              <Trans>Invalid range selected. The min price must be lower than the max price.</Trans>
                            </ThemedText.DeprecatedYellow>
                          </RowBetween>
                        </YellowCard>
                      ) : null}
                    </DynamicSection>
                  </RightContainer>
                </>

              </ResponsiveTwoColumns>
            </Wrapper>
          </PageWrapper>
          {/* <Column  style={{ maxWidth: 656 }}> */}
          <Buttons />
          {/* </Column> */}
          {showOwnershipWarning && <OwnershipWarning ownerAddress={owner} />}
          {addIsUnsupported && (
            <UnsupportedCurrencyFooter
              show={addIsUnsupported}
              currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]}
            />
          )}
        </AutoColumn>



        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash}
          content={() => (
            <ConfirmationModalContent
              title={<Trans>Overview</Trans>}
              onDismiss={handleDismissConfirmation}
              topContent={() => (
                <Review
                  parsedAmounts={parsedAmounts}
                  position={position}
                  existingPosition={existingPosition}
                  priceLower={priceLower}
                  priceUpper={priceUpper}
                  outOfRange={outOfRange}
                  ticksAtLimit={ticksAtLimit}
                />
              )}
              bottomContent={() => (
                <ButtonPrimary style={{ marginTop: '1rem' }} onClick={onAdd}>
                  <Text fontWeight={500} fontSize={20}>
                    <Trans>Add</Trans>
                  </Text>
                </ButtonPrimary>
              )}
            />
          )}
          pendingText={pendingText}
        />

      </ScrollablePage>
      <SwitchLocaleLink />
    </>
  )
}
