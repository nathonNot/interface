import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfacePageName } from '@uniswap/analytics-events'
import Button from 'components/Button'
import { AutoColumn } from 'components/Column'
import PageTitle from 'components/PageTitle'
import Row, { RowBetween } from 'components/Row'
import { MAX_WIDTH_MEDIA_BREAKPOINT, MEDIUM_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { filterStringAtom } from 'components/Tokens/state'
import NetworkFilter from 'components/Tokens/TokenTable/NetworkFilter'
import SearchBar from 'components/Tokens/TokenTable/SearchBar'
import TimeSelector from 'components/Tokens/TokenTable/TimeSelector'
import TokenTable from 'components/Tokens/TokenTable/TokenTable'
import { MouseoverTooltip } from 'components/Tooltip'
import { useResetAtom } from 'jotai/utils'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import { useIsMobile } from 'nft/hooks'

const PageWrapper = styled(AutoColumn)`
  padding: 68px 16px 0px;
  max-width: 1200px;
  width: 100%;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    max-width: 800px;
  `};

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    max-width: 500px;
  `};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`

const ExploreContainer = styled.div`
  width: 100%;
  min-width: 320px;
  padding: 68px 12px 0px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`
const TitleContainer = styled.div`
  margin-bottom: 32px;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin-left: auto;
  margin-right: auto;
  display: flex;
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
const FiltersWrapper = styled.div`
  display: flex;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin: 0 auto;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.textTertiary};
  flex-direction: row;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    flex-direction: column;
    gap: 8px;
  }
`

const SummaryBox = styled.div`
  padding: 16px 24px;
  border-radius: 12px;
  background: #26143D;
`

const Tokens = () => {
  const resetFilterString = useResetAtom(filterStringAtom)
  const location = useLocation()
  const isMobile = useIsMobile();

  useEffect(() => {
    resetFilterString()
  }, [location, resetFilterString])

  const theme = useTheme();

  if (isMobile) {
    return (
      <Trace page={InterfacePageName.TOKENS_PAGE} shouldLogImpression>
        <PageWrapper gap='16px'>
          <PageTitle
            title='Pools'
            desc='Search and find the best asset'
          />
          <Row gap='16px' width='100%'>
            <Button as={Link} to="/pools">+ <Trans>Manage Liquidity</Trans></Button>
            <Button gap='8px' as={Link} to="/add/ETH">+ <Trans>Add Liquidity</Trans></Button>
          </Row>
          <SearchContainer>
            <SearchBar />
          </SearchContainer>
          <TokenTable />
        </PageWrapper>
      </Trace>
    )
  }

  return (
    <Trace page={InterfacePageName.TOKENS_PAGE} shouldLogImpression>
      <PageWrapper gap='32px'>
        <RowBetween>
          <PageTitle
            title='Pools'
            desc='Search and find the best asset'
          />
          <Row gap='16px' width='auto'>
            <Button as={Link} to="/pools">+ <Trans>Manage Liquidity</Trans></Button>
            <Button gap='8px' as={Link} to="/add/ETH">+ <Trans>Add Liquidity</Trans></Button>
          </Row>
        </RowBetween>

        <SummaryBox>
          <Row gap='10px'>
            <Row gap='12px'>
              <Text fontSize={16} fontWeight={500} color={theme.primary}>Liquidity</Text>
              <Text fontSize={18} fontWeight={600} color='#F4F4F4'>$548,454,812</Text>
            </Row>
            <Row gap='12px'>
              <Text fontSize={16} fontWeight={500} color={theme.primary}>Volume (24h)</Text>
              <Text fontSize={18} fontWeight={600} color='#F4F4F4'>$548,454,812</Text>
            </Row>
          </Row>

        </SummaryBox>
        <SearchContainer>
          <SearchBar />
        </SearchContainer>
        <TokenTable />
      </PageWrapper>
    </Trace>
  )
}

export default Tokens
