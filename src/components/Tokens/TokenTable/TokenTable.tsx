import { Trans } from '@lingui/macro'
import { PAGE_SIZE, useTopTokens } from 'graphql/data/TopTokens'
import { validateUrlChainParam } from 'graphql/data/util'
import { CSSProperties, ReactNode, useCallback, useEffect, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components/macro'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import { HeaderRow, LoadedRow, LoadingRow } from './TokenRow'
import { useWeb3React } from '@web3-react/core'

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  // box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
  //   0px 24px 32px rgba(0, 0, 0, 0.01);
  margin-left: auto;
  margin-right: auto;
  // border-radius: 12px;
  justify-content: center;
  align-items: center;
`

const TokenDataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  width: 100%;
`

const NoTokenDisplay = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  height: 60px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 16px;
  font-weight: 500;
  align-items: center;
  padding: 0px 28px;
  gap: 8px;
`

const FeeTierText = styled.div<{ isMobile?: boolean }>`
  border-radius: 4px;
  font-size: ${({ isMobile }) => `${isMobile ? 12 : 14}px`};
  padding: ${({ isMobile }) => `${isMobile ? 2 : 4}px 8px`};
  font-weight: 600;
  color: ${({ theme }) => theme.primary};
  background: ${({ theme }) => `${theme.primary}40`};

`

const ContentBox = styled.div`
  flex: 0 1 33%;
  height: 100%;
  word-break: break-all;

  color: #FFF;
  font-family: Poppins;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  letter-spacing: 0.06px;

  & > div:first-child {
    color: var(--Dark-Text-Color-Grey-60, #A7A6B8);
    font-weight: 400;
  }
`

function NoTokensState({ message }: { message: ReactNode }) {
  return (
    <GridContainer>
      <HeaderRow />
      <NoTokenDisplay>{message}</NoTokenDisplay>
    </GridContainer>
  )
}

const LoadingRows = ({ rowCount }: { rowCount: number }) => (
  <>
    {Array(rowCount)
      .fill(null)
      .map((_, index) => {
        return <LoadingRow key={index} first={index === 0} last={index === rowCount - 1} />
      })}
  </>
)

function LoadingTokenTable({ rowCount = PAGE_SIZE }: { rowCount?: number }) {
  return (
    <GridContainer>
      <HeaderRow />
      <TokenDataContainer>
        <LoadingRows rowCount={rowCount} />
      </TokenDataContainer>
    </GridContainer>
  )
}

import { useMount } from 'ahooks';
import Button from 'components/Button'
import { useIsMobile } from 'nft/hooks'
import { currencyId } from 'utils/currencyId'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { formatAnalyticsEventProperties } from 'components/SearchModal/CurrencyList'
import { useAllTokenBalances } from 'state/connection/hooks'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import DoubleCurrencyName from 'components/DoubleCurrencyName'
import Row, { RowBetween } from 'components/Row'
import { Percent } from '@uniswap/sdk-core'
import { AutoColumn } from 'components/Column'
export default function TokenTable() {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  // console.log(chainName, 'chainName')
  const { chainId } = useWeb3React()
  // console.log(chainId, useWeb3React())
  // const { tokens, tokenSortRank, loadingTokens, sparklines } = useTopTokens(chainName)

  const [tokens, setTokens] = useState<any[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  const isMobie = useIsMobile()
  // console.log(tokenSortRank, sparklines)
  useEffect(() => {
    console.log(chainId, 'chainId')
    if (!chainId) return;
    setLoadingTokens(true);
    fetch(`http://chain-watch.appk.cc/api/token_list/${chainId}`).then(response => {
      console.log(response)
      if (response.status === 200) {
        return response.json()
      }
      // throw new Error(response.statusText)
    })
      .then(json => {
        console.log(json, 'json')
        if (json) {
          setTokens(json);
          return;
        }

        setTokens([
          {
            "pool_address": "0x572a9e0a59006854126c1b35edaa4a042d0413b3",
            "token0": "0x06565ed324Ee9fb4DB0FF80B7eDbE4Cb007555a3",
            "token0_price": "0",
            "token1": "0xCA4E13EabFfd21c1Dc23B6dE1b377274531FFD32",
            "token1_price": "0",
            "liquidity_price": 0,
            "fee": "10000",
            "tickCurrent": "191751587355425709153259668337522",
            "tickSpacing": "200",
            "apy": 0,
            "total_24h_value": "0"
          },
          {
            "pool_address": "0x4a2ebf265ff33f2816cb0cd4dad0c99e6811a711",
            "token0": "0x06565ed324Ee9fb4DB0FF80B7eDbE4Cb007555a3",
            "token0_price": "0",
            "token1": "0xCA4E13EabFfd21c1Dc23B6dE1b377274531FFD32",
            "token1_price": "0",
            "liquidity_price": 0,
            "fee": "500",
            "tickCurrent": "191756990178320398671987043155599",
            "tickSpacing": "10",
            "apy": 0,
            "total_24h_value": "0"
          },
          {
            "pool_address": "0x8ead3bc281bd7a2d9fafdb91e835a0774c2df683",
            "token0": "0x06565ed324Ee9fb4DB0FF80B7eDbE4Cb007555a3",
            "token0_price": "64.72559600000001",
            "token1": "0xFD625D7780EA61bd998d6AF6F890a27ab973D2Bb",
            "token1_price": "707.4628538938999",
            "liquidity_price": 772.1884498938999,
            "fee": "10000",
            "tickCurrent": "191751587355425709153259668337522",
            "tickSpacing": "200",
            "apy": 0,
            "total_24h_value": "0"
          },
          {
            "pool_address": "0x1f206e028c07560ffa8ca70ca74d98e29382de3a",
            "token0": "0x06565ed324Ee9fb4DB0FF80B7eDbE4Cb007555a3",
            "token0_price": "3.514512",
            "token1": "0xFD625D7780EA61bd998d6AF6F890a27ab973D2Bb",
            "token1_price": "3.503160072950489",
            "liquidity_price": 7.017672072950489,
            "fee": "500",
            "tickCurrent": "191756990178320398671987043155599",
            "tickSpacing": "10",
            "apy": 0,
            "total_24h_value": "0"
          }
        ])
      })
      .catch(err => console.log('Request Failed', err)).finally(() => {
        setLoadingTokens(false);
      });
  }, [chainId])

  // /* loading and error state */
  // if (loadingTokens && !tokens) {
  //   return <LoadingTokenTable rowCount={PAGE_SIZE} />
  // } else if (!tokens) {
  //   return (
  //     <NoTokensState
  //       message={
  //         <>
  //           <AlertTriangle size={16} />
  //           <Trans>An error occurred loading tokens. Please try again.</Trans>
  //         </>
  //       }
  //     />
  //   )
  // } else if (tokens?.length === 0) {
  //   return <NoTokensState message={<Trans>No tokens found</Trans>} />
  // } else {
  //   return (
  //     <GridContainer>
  //       <HeaderRow />
  //       <TokenDataContainer>
  //         {tokens.map(
  //           (token, index) =>
  //             token?.address && (
  //               <LoadedRow
  //                 key={token.address}
  //                 tokenListIndex={index}
  //                 tokenListLength={tokens.length}
  //                 token={token}
  //                 sparklineMap={sparklines}
  //                 sortRank={tokenSortRank[token.address]}
  //               />
  //             )
  //         )}
  //       </TokenDataContainer>
  //     </GridContainer>
  //   )
  // }

  const [balances, balancesAreLoading] = useAllTokenBalances()

  if (isMobie) {
    return (
      <>
        {
          tokens.map((token, index) => {
            return (
              <>
                <AutoColumn gap='8px'>
                  <Row gap='6px'>
                    <DoubleCurrencyLogo currency0={balances[token.token0]?.currency} currency1={balances[token.token1]?.currency} size={20} margin />
                    <DoubleCurrencyName currency0={balances[token.token0]?.currency} currency1={balances[token.token1]?.currency} size={14} />
                    <FeeTierText isMobile={isMobie}>
                      <Trans>{new Percent(token.fee, 1_000_000).toSignificant()}%</Trans>
                    </FeeTierText>
                  </Row>
                  <Row gap='20px'>
                    <ContentBox>
                      <div>Liquidity</div>
                      <div>{token.liquidity_price}</div>
                    </ContentBox>
                    <ContentBox>
                      <div>Range</div>
                      <div>-{token.tickSpacing}% ~ {token.tickSpacing}%</div>
                    </ContentBox>
                    <ContentBox>
                      <div>APR</div>
                      <div>{token.apy}</div>
                    </ContentBox>
                  </Row>
                </AutoColumn>
                {
                  index !== tokens.length - 1 && <RowBetween height={1} backgroundColor='#312E63' />
                }
              </>
            )
          })
        }
      </>
    )
  }

  return (
    <table>
      <thead>
        <td>Name</td>
        <td>Liquidity</td>
        <td>Range</td>
        <td>Volume (24h)</td>
        <td>APR</td>
      </thead>
      <tbody>
        {
          tokens.map((token, index) => {
            return (
              <tr>
                <td>
                  <Row gap='12px'>
                    <DoubleCurrencyLogo currency0={balances[token.token0]?.currency} currency1={balances[token.token1]?.currency} size={20} margin />
                    <DoubleCurrencyName currency0={balances[token.token0]?.currency} currency1={balances[token.token1]?.currency} size={16} />
                    <FeeTierText>
                      <Trans>{new Percent(token.fee, 1_000_000).toSignificant()}%</Trans>
                    </FeeTierText>
                  </Row>
                </td>
                <td width='15%'>{token.liquidity_price}</td>
                <td width='15%'>-{token.tickSpacing}% ~ {token.tickSpacing}%</td>
                <td width='15%'>{token.total_24h_value}</td>
                <td width='15%'>{token.apy}</td>
                <td><Button padding='8px 16px' style={{ borderRadius: '6px', background: 'transparent' }} gap='8px' as={Link} to={`/add/${token.token0}/${token.token1}`}><Trans>Add Liquidity</Trans></Button></td>
              </tr>
            )
          })
        }

      </tbody>
    </table>
  )



}
