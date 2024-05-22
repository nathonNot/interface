import { Trans } from '@lingui/macro'
import { PAGE_SIZE } from 'graphql/data/TopTokens'
import { validateUrlChainParam } from 'graphql/data/util'
import { ReactNode, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'

import { MAX_WIDTH_MEDIA_BREAKPOINT, MEDIUM_MEDIA_BREAKPOINT } from '../constants'
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

const FiltersContainer = styled.div`
  display: flex;
  gap: 8px;
  height: 40px;

  // @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
  //   order: 2;
  // }
`

const SearchContainer = styled(FiltersContainer)`
  width: 100%;

  // @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
  //   margin: 0px;
  //   order: 1;
  // }
`

const SummaryBox = styled.div`
  padding: 16px 24px;
  border-radius: 12px;
  background: #26143D;
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

import Button from 'components/Button'
import { useIsMobile } from 'nft/hooks'
import { useAllTokenBalances } from 'state/connection/hooks'
import Row, { RowBetween } from 'components/Row'
import { AutoColumn } from 'components/Column'
import SearchBar from './SearchBar'
import { Text } from 'rebass'
import { AlertTriangle } from 'react-feather'
import Empty from 'components/Empty'
import TokenInfo from './TokenInfo'
export default function TokenTable() {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const { chainId } = useWeb3React()

  const [tokens, setTokens] = useState<any[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [isError, setIsError] = useState(false);

  const isMobie = useIsMobile()
  const theme = useTheme();

  useEffect(() => {
    if (!chainId) return;
    setLoadingTokens(true);
    fetch(`http://chain-watch.appk.cc/api/v1/token_list/${chainId}`).then(response => {
      if (response.status === 200) {
        return response.json()
      }
      // throw new Error(response.statusText);

      return Promise.reject(response.statusText)
    })
      .then(json => {
        if (json) {
          setTokens(json);
          setIsError(false);
          return;
        }
      })
      .catch(err => {
        console.log('Request Failed', err);
        setIsError(true);
      })
      .finally(() => {
        setLoadingTokens(false);
      });
  }, [chainId])

  const liquidity = tokens?.reduce((prev, next) => {
    const pre = typeof prev === 'number' ? prev : prev.txCount;
    return (pre + (next?.txCount))
  }, 0);

  const volume = tokens?.reduce((prev, next) => {
    const pre = typeof prev === 'number' ? prev : prev.volume24h;
    return (Number(pre) + Number(next?.volume24h))
  }, 0);

  const content = (
    <>
      <SummaryBox>
        <Row gap='10px'>
          <Row gap='12px'>
            <Text fontSize={16} fontWeight={500} color={theme.primary}>Liquidity</Text>
            <Text fontSize={18} fontWeight={600} color='#F4F4F4'>${(liquidity).toFixed(2) ?? '-'}</Text>
          </Row>
          <Row gap='12px'>
            <Text fontSize={16} fontWeight={500} color={theme.primary}>Volume (24h)</Text>
            <Text fontSize={18} fontWeight={600} color='#F4F4F4'>${(volume).toFixed(2) ?? '-'}</Text>
          </Row>
        </Row>
      </SummaryBox>
      <table>
        <thead>
          <td>Name</td>
          <td>Liquidity</td>
          <td>TVL</td>
          <td>Volume (24h)</td>
          <td>APR</td>
        </thead>
        <tbody>
          {
            tokens.map((token, index) => {
              return (
                <tr>
                  <td>
                    <TokenInfo token0={token.token0} token1={token.token1} fee={token.feeTier} />
                  </td>
                  <td width='15%'>
                    ${Number(token.txCount)?.toFixed(2)}
                  </td>
                  <td width='15%'>
                    ${Number(token.totalLiquidity)?.toFixed(2)}
                  </td>
                  <td width='15%'>
                    ${Number(token.volume24h)?.toFixed(2)}
                  </td>
                  <td width='15%'>{token.apr}</td>
                  <td><Button padding='8px 16px' style={{ borderRadius: '6px', background: 'transparent' }} gap='8px' as={Link} to={`/add/${token.token0}/${token.token1}/${token.feeTier}`}><Trans>Add Liquidity</Trans></Button></td>
                </tr>
              )
            })
          }
        </tbody>
      </table>
    </>
  )

  const mobileContent = (
    tokens.map((token, index) => {
      return (
        <>
          <AutoColumn gap='8px' as={Link} to={`/add/${token.token0}/${token.token1}/${token.feeTier}`} style={{ textDecoration: 'none' }}>
            <TokenInfo token0={token.token0} token1={token.token1} fee={token.feeTier} isMobile />
            <Row gap='20px'>
              <ContentBox>
                <div>Liquidity</div>
                <div>${Number(token.txCount)?.toFixed(2)}</div>
              </ContentBox>
              <ContentBox>
                <div>TVL</div>
                <div>${Number(token.totalLiquidity)?.toFixed(2)}</div>
              </ContentBox>
              <ContentBox>
                <div>APR</div>
                <div>{token.apr}</div>
              </ContentBox>
            </Row>
          </AutoColumn>
          {
            index !== tokens.length - 1 && <RowBetween height={1} backgroundColor='#312E63' />
          }
        </>
      )
    })
  )

  return (
    <>
      {/* <SearchContainer>
        <SearchBar />
      </SearchContainer> */}
      {
        loadingTokens ? (
          <LoadingTokenTable rowCount={PAGE_SIZE} />
        ) : isError ? (
          <NoTokenDisplay>
            <AlertTriangle size={16} />
            <Trans>An error occurred loading tokens. Please try again.</Trans>
          </NoTokenDisplay>
        ) : !tokens.length ? (
          <Empty />
        ) : (
          isMobie ? mobileContent : content
        )
      }
    </>
  )
}
