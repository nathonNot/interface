import { BigNumber } from '@ethersproject/bignumber'
import type { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { NonfungiblePositionManager } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { sendEvent } from 'components/analytics'
import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonConfirmed, ButtonPrimary } from 'components/Button'
import Card, { LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { Break } from 'components/earn/styled'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import Loader from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { AddRemoveTabs } from 'components/NavigationTabs'
import Row, { AutoRow, RowBetween, RowFixed } from 'components/Row'
import Slider from 'components/Slider'
import Toggle from 'components/Toggle'
import { isSupportedChain } from 'constants/chains'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import useDebouncedChangeHandler from 'hooks/useDebouncedChangeHandler'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { PositionPageUnsupportedContent } from 'pages/Pool/PositionPage'
import { useCallback, useMemo, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { Text } from 'rebass'
import { useBurnV3ActionHandlers, useBurnV3State, useDerivedV3BurnInfo } from 'state/burn/v3/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import { WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import { TransactionType } from '../../state/transactions/types'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import { currencyId } from '../../utils/currencyId'
import AppBody from '../AppBody'
import { ResponsiveHeaderText, SmallMaxButton, Wrapper } from './styled'
import styled from 'styled-components'
import BackBtn from 'components/BackBtn'
import { useAppDispatch } from 'state/hooks'
import { resetMintState } from 'state/mint/actions'
import { resetMintState as resetMintV3State } from 'state/mint/v3/actions'
import PageTitle from 'components/PageTitle'

const DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(5, 100)

const TopContent = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
`

const SliderCard = styled(Card)`
  border-radius: 12px;
  background: #2D2A61;
  padding: 12px 16px 19px 16px;
`

const SummaryCard = styled(Card)`
  border-radius: 16px;
  background: #23204E;
  padding: 20px 19px;
`

const BodyWrap = styled(AppBody)`
  border: none;
  border-radius: 16px;
  background: #1F1D3B;
  max-width: ${({ $maxWidth }) => $maxWidth ?? '420px'};
`

// redirect invalid tokenIds
export default function RemoveLiquidityV3() {
  const { chainId } = useWeb3React()
  const { tokenId } = useParams<{ tokenId: string }>()
  const location = useLocation()
  const parsedTokenId = useMemo(() => {
    try {
      return BigNumber.from(tokenId)
    } catch {
      return null
    }
  }, [tokenId])

  if (parsedTokenId === null || parsedTokenId.eq(0)) {
    return <Navigate to={{ ...location, pathname: '/pools' }} replace />
  }

  if (isSupportedChain(chainId)) {
    return <Remove tokenId={parsedTokenId} />
  } else {
    return <PositionPageUnsupportedContent />
  }
}
function Remove({ tokenId }: { tokenId: BigNumber }) {
  const { position } = useV3PositionFromTokenId(tokenId)
  const theme = useTheme()
  const { account, chainId, provider } = useWeb3React()

  // flag for receiving WETH
  const [receiveWETH, setReceiveWETH] = useState(false)
  const nativeCurrency = useNativeCurrency()
  const nativeWrappedSymbol = nativeCurrency.wrapped.symbol

  // burn state
  const { percent } = useBurnV3State()
  const {
    position: positionSDK,
    liquidityPercentage,
    liquidityValue0,
    liquidityValue1,
    feeValue0,
    feeValue1,
    outOfRange,
    error,
  } = useDerivedV3BurnInfo(position, receiveWETH)
  const { onPercentSelect } = useBurnV3ActionHandlers()

  const removed = position?.liquidity?.eq(0)

  // boilerplate for the slider
  const [percentForSlider, onPercentSelectForSlider] = useDebouncedChangeHandler(percent, onPercentSelect)

  const deadline = useTransactionDeadline() // custom from users settings
  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE) // custom from users

  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txnHash, setTxnHash] = useState<string | undefined>()
  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()
  const burn = useCallback(async () => {
    setAttemptingTxn(true)
    if (
      !positionManager ||
      !liquidityValue0 ||
      !liquidityValue1 ||
      !deadline ||
      !account ||
      !chainId ||
      !positionSDK ||
      !liquidityPercentage ||
      !provider
    ) {
      return
    }

    // we fall back to expecting 0 fees in case the fetch fails, which is safe in the
    // vast majority of cases
    const { calldata, value } = NonfungiblePositionManager.removeCallParameters(positionSDK, {
      tokenId: tokenId.toString(),
      liquidityPercentage,
      slippageTolerance: allowedSlippage,
      deadline: deadline.toString(),
      collectOptions: {
        expectedCurrencyOwed0: feeValue0 ?? CurrencyAmount.fromRawAmount(liquidityValue0.currency, 0),
        expectedCurrencyOwed1: feeValue1 ?? CurrencyAmount.fromRawAmount(liquidityValue1.currency, 0),
        recipient: account,
      },
    })

    const txn = {
      to: positionManager.address,
      data: calldata,
      value,
    }

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
            sendEvent({
              category: 'Liquidity',
              action: 'RemoveV3',
              label: [liquidityValue0.currency.symbol, liquidityValue1.currency.symbol].join('/'),
            })
            setTxnHash(response.hash)
            setAttemptingTxn(false)
            addTransaction(response, {
              type: TransactionType.REMOVE_LIQUIDITY_V3,
              baseCurrencyId: currencyId(liquidityValue0.currency),
              quoteCurrencyId: currencyId(liquidityValue1.currency),
              expectedAmountBaseRaw: liquidityValue0.quotient.toString(),
              expectedAmountQuoteRaw: liquidityValue1.quotient.toString(),
            })
          })
      })
      .catch((error) => {
        setAttemptingTxn(false)
        console.error(error)
      })
  }, [
    positionManager,
    liquidityValue0,
    liquidityValue1,
    deadline,
    account,
    chainId,
    feeValue0,
    feeValue1,
    positionSDK,
    liquidityPercentage,
    provider,
    tokenId,
    allowedSlippage,
    addTransaction,
  ])

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txnHash) {
      onPercentSelectForSlider(0)
    }
    setAttemptingTxn(false)
    setTxnHash('')
  }, [onPercentSelectForSlider, txnHash])

  const pendingText = (
    <Trans>
      Removing {liquidityValue0?.toSignificant(6)} {liquidityValue0?.currency?.symbol} and{' '}
      {liquidityValue1?.toSignificant(6)} {liquidityValue1?.currency?.symbol}
    </Trans>
  )

  function modalHeader() {
    return (
      <AutoColumn gap="sm" style={{ padding: '16px' }}>
        <RowBetween align="flex-end">
          <Text fontSize={16} fontWeight={500}>
            <Trans>Pooled {liquidityValue0?.currency?.symbol}:</Trans>
          </Text>
          <RowFixed>
            <Text fontSize={16} fontWeight={500} marginLeft="6px">
              {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}
            </Text>
            <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue0?.currency} />
          </RowFixed>
        </RowBetween>
        <RowBetween align="flex-end">
          <Text fontSize={16} fontWeight={500}>
            <Trans>Pooled {liquidityValue1?.currency?.symbol}:</Trans>
          </Text>
          <RowFixed>
            <Text fontSize={16} fontWeight={500} marginLeft="6px">
              {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}
            </Text>
            <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue1?.currency} />
          </RowFixed>
        </RowBetween>
        {feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) ? (
          <>
            <ThemedText.DeprecatedItalic fontSize={12} color={theme.textSecondary} textAlign="left" padding="8px 0 0 0">
              <Trans>You will also collect fees earned from this position.</Trans>
            </ThemedText.DeprecatedItalic>
            <RowBetween>
              <Text fontSize={16} fontWeight={500}>
                <Trans>{feeValue0?.currency?.symbol} Fees Earned:</Trans>
              </Text>
              <RowFixed>
                <Text fontSize={16} fontWeight={500} marginLeft="6px">
                  {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />}
                </Text>
                <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={feeValue0?.currency} />
              </RowFixed>
            </RowBetween>
            <RowBetween>
              <Text fontSize={16} fontWeight={500}>
                <Trans>{feeValue1?.currency?.symbol} Fees Earned:</Trans>
              </Text>
              <RowFixed>
                <Text fontSize={16} fontWeight={500} marginLeft="6px">
                  {feeValue1 && <FormattedCurrencyAmount currencyAmount={feeValue1} />}
                </Text>
                <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={feeValue1?.currency} />
              </RowFixed>
            </RowBetween>
          </>
        ) : null}
        <ButtonPrimary mt="16px" onClick={burn}>
          <Trans>Remove</Trans>
        </ButtonPrimary>
      </AutoColumn>
    )
  }

  const showCollectAsWeth = Boolean(
    liquidityValue0?.currency &&
    liquidityValue1?.currency &&
    (liquidityValue0.currency.isNative ||
      liquidityValue1.currency.isNative ||
      WRAPPED_NATIVE_CURRENCY[liquidityValue0.currency.chainId]?.equals(liquidityValue0.currency.wrapped) ||
      WRAPPED_NATIVE_CURRENCY[liquidityValue1.currency.chainId]?.equals(liquidityValue1.currency.wrapped))
  )

  const dispatch = useAppDispatch();

  console.log(position, 'position')
  return (
    <AutoColumn>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txnHash ?? ''}
        content={() => (
          <ConfirmationModalContent
            title={<Trans>Remove Liquidity</Trans>}
            onDismiss={handleDismissConfirmation}
            topContent={modalHeader}
          />
        )}
        pendingText={pendingText}
      />
      {/* <TopContent>
          <BackBtn
            text='Back'
            to={'/pools' + (tokenId.toString() ? `/${tokenId.toString().toString()}` : '')}
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
            title='Remove Liquidity'
          />
        </TopContent> */}
      <BodyWrap $maxWidth="860px">
        <AddRemoveTabs
          creating={false}
          adding={false}
          positionID={tokenId.toString()}
          defaultSlippage={DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE}
        />

        <Wrapper>
          {position ? (
            <AutoColumn gap="lg">
              <Row gap='12px'>
                <DoubleCurrencyLogo
                  currency0={feeValue0?.currency ?? undefined}
                  currency1={feeValue1?.currency ?? undefined}
                  size={40}
                  margin={true}
                />
                <AutoColumn gap='2px'>
                  <ThemedText.DeprecatedBlack fontSize="24px">
                    {feeValue0?.currency?.symbol} / {feeValue1?.currency?.symbol}
                  </ThemedText.DeprecatedBlack>
                  <Row color='#9B98D0'>
                    <ThemedText.DeprecatedBlack color='#9B98D0'>
                      <Trans>Fee Rate:</Trans>
                    </ThemedText.DeprecatedBlack>
                    <ThemedText.DeprecatedBlack color='primary'>
                      <Trans>{position?.fee / 10000}%</Trans>
                    </ThemedText.DeprecatedBlack>
                  </Row>
                </AutoColumn>
              </Row>
              <SliderCard>
                <AutoColumn gap="16px">
                  <div style={{ color: '#F4F4F4', textAlign: 'center' }}>
                    <ThemedText.DeprecatedMain fontSize={16} color='#F4F4F4' textAlign='center'>
                      Remove Percentage
                    </ThemedText.DeprecatedMain>
                  </div>
                  <RowBetween>
                    <ResponsiveHeaderText color={theme.primary}>
                      <Trans>{percentForSlider}%</Trans>
                    </ResponsiveHeaderText>
                  </RowBetween>
                  <AutoColumn gap="8px">

                    <div style={{ position: 'relative' }}>
                      <Slider value={percentForSlider} onChange={onPercentSelectForSlider} />
                      {/* <div style={{ position: 'absolute', top: '50%', transform: 'translate(0, -50%)', left: `${percentForSlider}%` }}>
                        <ThemedText.LabelSmall color='primary'>
                          <Trans>{percentForSlider}%</Trans>
                        </ThemedText.LabelSmall>
                      </div> */}
                    </div>
                    <RowBetween color='#A7A6B8'>
                      <ThemedText.BodySmall color='#A7A6B8'>
                        <Trans>0%</Trans>
                      </ThemedText.BodySmall>
                      <ThemedText.BodySmall color='#A7A6B8'>
                        <Trans>25%</Trans>
                      </ThemedText.BodySmall>
                      <ThemedText.BodySmall color='#A7A6B8'>
                        <Trans>50%</Trans>
                      </ThemedText.BodySmall>
                      <ThemedText.BodySmall color='#A7A6B8'>
                        <Trans>75%</Trans>
                      </ThemedText.BodySmall>
                      <ThemedText.BodySmall color='#A7A6B8'>
                        <Trans>100%</Trans>
                      </ThemedText.BodySmall>
                    </RowBetween>
                  </AutoColumn>
                </AutoColumn>
              </SliderCard>
              <SummaryCard>
                <AutoColumn gap="16px">
                  <ThemedText.DeprecatedLabel fontSize={18} style={{ color: '#E4E4E5' }}>Summary</ThemedText.DeprecatedLabel>
                  <AutoColumn gap="8px">
                    <RowBetween>
                      <Text fontSize={16} fontWeight={400} color='#8B89AA'>
                        <Trans>Pooled {liquidityValue0?.currency?.symbol}:</Trans>
                      </Text>
                      <RowFixed>
                        <Text fontSize={16} fontWeight={400} marginLeft="6px" color='#E4E4E5'>
                          {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}
                        </Text>
                        <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue0?.currency} />
                      </RowFixed>
                    </RowBetween>
                    <RowBetween>
                      <Text fontSize={16} fontWeight={400} color='#8B89AA'>
                        <Trans>Pooled {liquidityValue1?.currency?.symbol}:</Trans>
                      </Text>
                      <RowFixed>
                        <Text fontSize={16} fontWeight={400} marginLeft="6px" color='#E4E4E5'>
                          {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}
                        </Text>
                        <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue1?.currency} />
                      </RowFixed>
                    </RowBetween>
                  </AutoColumn>
                  <Break />
                  <AutoColumn gap="8px">
                    {feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) ? (
                      <>
                        <RowBetween>
                          <Text fontSize={16} fontWeight={400} color='#8B89AA'>
                            <Trans>{feeValue0?.currency?.symbol} Fees Earned:</Trans>
                          </Text>
                          <RowFixed>
                            <Text fontSize={16} fontWeight={400} marginLeft="6px" color='#E4E4E5'>
                              {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />}
                            </Text>
                            <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={feeValue0?.currency} />
                          </RowFixed>
                        </RowBetween>
                        <RowBetween>
                          <Text fontSize={16} fontWeight={400} color='#8B89AA'>
                            <Trans>{feeValue1?.currency?.symbol} Fees Earned:</Trans>
                          </Text>
                          <RowFixed>
                            <Text fontSize={16} fontWeight={400} marginLeft="6px" color='#E4E4E5'>
                              {feeValue1 && <FormattedCurrencyAmount currencyAmount={feeValue1} />}
                            </Text>
                            <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={feeValue1?.currency} />
                          </RowFixed>
                        </RowBetween>
                      </>
                    ) : null}
                  </AutoColumn>
                </AutoColumn>
              </SummaryCard>

              <div style={{ display: 'flex' }}>
                <AutoColumn gap="md" style={{ flex: '1' }}>
                  <ButtonConfirmed
                    confirmed={false}
                    disabled={removed || percent === 0 || !liquidityValue0}
                    onClick={() => setShowConfirm(true)}
                  >
                    {removed ? <Trans>Closed</Trans> : error ?? <Trans>Remove</Trans>}
                  </ButtonConfirmed>
                </AutoColumn>
              </div>
            </AutoColumn>
          ) : (
            <Loader />
          )}
        </Wrapper>
      </BodyWrap>
    </AutoColumn>
  )
}
