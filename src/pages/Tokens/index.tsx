import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfacePageName } from '@uniswap/analytics-events'
import Button from 'components/Button'
import { AutoColumn } from 'components/Column'
import PageTitle from 'components/PageTitle'
import Row, { RowBetween } from 'components/Row'
import { filterStringAtom } from 'components/Tokens/state'
import TokenTable from 'components/Tokens/TokenTable/TokenTable'
import { useResetAtom } from 'jotai/utils'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'
import { Link } from 'react-router-dom'
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

const Tokens = () => {
  const resetFilterString = useResetAtom(filterStringAtom)
  const location = useLocation()
  const isMobile = useIsMobile();

  useEffect(() => {
    resetFilterString()
  }, [location, resetFilterString])

  if (isMobile) {
    return (
      <Trace page={InterfacePageName.TOKENS_PAGE} shouldLogImpression>
        <PageWrapper gap='16px'>
          <PageTitle
            title='Pools'
            desc='Search and find the best asset'
          />
          <Row gap='16px' width='100%'>
            <Button as={Link} to="/pools" gap='8px' style={{ width: '100%' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="20" viewBox="0 0 22 20" fill="none">
                <g id="Group">
                  <path id="Vector" d="M2.08206 11.945C1.55306 10.995 1.28906 10.519 1.28906 10C1.28906 9.48101 1.55306 9.00601 2.08206 8.05601L3.43006 5.63001L4.85606 3.24901C5.41506 2.31601 5.69406 1.84901 6.14306 1.58901C6.59306 1.33001 7.13606 1.32201 8.22306 1.30401L11.0001 1.26001L13.7751 1.30401C14.8631 1.32201 15.4061 1.33001 15.8551 1.59001C16.3051 1.85001 16.5851 2.31601 17.1431 3.24901L18.5701 5.63001L19.9201 8.05601C20.4481 9.00601 20.7121 9.48101 20.7121 10C20.7121 10.519 20.4481 10.994 19.9191 11.944L18.5701 14.37L17.1441 16.751C16.5851 17.684 16.3061 18.151 15.8571 18.411C15.4071 18.67 14.8641 18.678 13.7771 18.696L11.0001 18.74L8.22506 18.696C7.13706 18.678 6.59406 18.67 6.14506 18.41C5.69506 18.15 5.41506 17.684 4.85706 16.751L3.43006 14.37L2.08206 11.945Z" stroke="#BC42FF" stroke-width="2" />
                  <path id="Vector_2" d="M11 13C12.6569 13 14 11.6569 14 10C14 8.34315 12.6569 7 11 7C9.34315 7 8 8.34315 8 10C8 11.6569 9.34315 13 11 13Z" stroke="#BC42FF" stroke-width="2" />
                </g>
              </svg>
              <Trans>Manage</Trans></Button>
            <Button gap='8px' as={Link} to="/add" style={{ width: '100%' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <g id="Group">
                  <path id="Vector" d="M10.5 20C10.5 20.3978 10.658 20.7794 10.9393 21.0607C11.2206 21.342 11.6022 21.5 12 21.5C12.3978 21.5 12.7794 21.342 13.0607 21.0607C13.342 20.7794 13.5 20.3978 13.5 20V13.5H20C20.3978 13.5 20.7794 13.342 21.0607 13.0607C21.342 12.7794 21.5 12.3978 21.5 12C21.5 11.6022 21.342 11.2206 21.0607 10.9393C20.7794 10.658 20.3978 10.5 20 10.5H13.5V4C13.5 3.60218 13.342 3.22064 13.0607 2.93934C12.7794 2.65804 12.3978 2.5 12 2.5C11.6022 2.5 11.2206 2.65804 10.9393 2.93934C10.658 3.22064 10.5 3.60218 10.5 4V10.5H4C3.60218 10.5 3.22064 10.658 2.93934 10.9393C2.65804 11.2206 2.5 11.6022 2.5 12C2.5 12.3978 2.65804 12.7794 2.93934 13.0607C3.22064 13.342 3.60218 13.5 4 13.5H10.5V20Z" fill="#BC42FF" />
                </g>
              </svg>
              <Trans>Add</Trans></Button>
          </Row>

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
            <Button as={Link} to="/pools" gap='8px'>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="20" viewBox="0 0 22 20" fill="none">
                <g id="Group">
                  <path id="Vector" d="M2.08206 11.945C1.55306 10.995 1.28906 10.519 1.28906 10C1.28906 9.48101 1.55306 9.00601 2.08206 8.05601L3.43006 5.63001L4.85606 3.24901C5.41506 2.31601 5.69406 1.84901 6.14306 1.58901C6.59306 1.33001 7.13606 1.32201 8.22306 1.30401L11.0001 1.26001L13.7751 1.30401C14.8631 1.32201 15.4061 1.33001 15.8551 1.59001C16.3051 1.85001 16.5851 2.31601 17.1431 3.24901L18.5701 5.63001L19.9201 8.05601C20.4481 9.00601 20.7121 9.48101 20.7121 10C20.7121 10.519 20.4481 10.994 19.9191 11.944L18.5701 14.37L17.1441 16.751C16.5851 17.684 16.3061 18.151 15.8571 18.411C15.4071 18.67 14.8641 18.678 13.7771 18.696L11.0001 18.74L8.22506 18.696C7.13706 18.678 6.59406 18.67 6.14506 18.41C5.69506 18.15 5.41506 17.684 4.85706 16.751L3.43006 14.37L2.08206 11.945Z" stroke="#BC42FF" stroke-width="2" />
                  <path id="Vector_2" d="M11 13C12.6569 13 14 11.6569 14 10C14 8.34315 12.6569 7 11 7C9.34315 7 8 8.34315 8 10C8 11.6569 9.34315 13 11 13Z" stroke="#BC42FF" stroke-width="2" />
                </g>
              </svg>
              <Trans>Manage Liquidity</Trans></Button>
            <Button gap='8px' as={Link} to="/add">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <g id="Group">
                  <path id="Vector" d="M10.5 20C10.5 20.3978 10.658 20.7794 10.9393 21.0607C11.2206 21.342 11.6022 21.5 12 21.5C12.3978 21.5 12.7794 21.342 13.0607 21.0607C13.342 20.7794 13.5 20.3978 13.5 20V13.5H20C20.3978 13.5 20.7794 13.342 21.0607 13.0607C21.342 12.7794 21.5 12.3978 21.5 12C21.5 11.6022 21.342 11.2206 21.0607 10.9393C20.7794 10.658 20.3978 10.5 20 10.5H13.5V4C13.5 3.60218 13.342 3.22064 13.0607 2.93934C12.7794 2.65804 12.3978 2.5 12 2.5C11.6022 2.5 11.2206 2.65804 10.9393 2.93934C10.658 3.22064 10.5 3.60218 10.5 4V10.5H4C3.60218 10.5 3.22064 10.658 2.93934 10.9393C2.65804 11.2206 2.5 11.6022 2.5 12C2.5 12.3978 2.65804 12.7794 2.93934 13.0607C3.22064 13.342 3.60218 13.5 4 13.5H10.5V20Z" fill="#BC42FF" />
                </g>
              </svg>
              <Trans>Add Liquidity</Trans></Button>
          </Row>
        </RowBetween>


        <TokenTable />
      </PageWrapper>
    </Trace>
  )
}

export default Tokens
