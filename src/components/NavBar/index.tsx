import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Web3Status from 'components/Web3Status'
import { chainIdToBackendName } from 'graphql/data/util'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useIsPoolsPage } from 'hooks/useIsPoolsPage'
import { useAtomValue } from 'jotai/utils'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { UniIcon } from 'nft/components/icons'
import { useIsMobile, useProfilePageState } from 'nft/hooks'
import { ProfilePageStateType } from 'nft/types'
import { ReactNode } from 'react'
import { NavLink, NavLinkProps, useLocation, useNavigate } from 'react-router-dom'
import { shouldDisableNFTRoutesAtom } from 'state/application/atoms'
import styled from 'styled-components/macro'

import { Bag } from './Bag'
import Blur from './Blur'
import { ChainSelector } from './ChainSelector'
import { MenuDropdown } from './MenuDropdown'
import { SearchBar } from './SearchBar'
import * as styles from './style.css'
import { PageTabIcon } from 'components/Icons/PageTabIcon'
import { AutoColumn } from 'components/Column'

const Nav = styled.nav<{ isMobile: boolean }>`
  padding: ${({ isMobile }) => isMobile ? '12px 16px' : '24px 75px'};
  width: 100%;
  z-index: 2;
`

interface MenuItemProps {
  href: string
  id?: NavLinkProps['id']
  isActive?: boolean
  children: ReactNode
  dataTestId?: string
}

const MenuItem = ({ href, dataTestId, id, isActive, children }: MenuItemProps) => {
  return (
    <NavLink
      to={href}
      className={isActive ? styles.activeMenuItem : styles.menuItem}
      id={id}
      style={{ textDecoration: 'none' }}
      data-testid={dataTestId}
    >
      {children}
    </NavLink>
  )
}

export const PageTabs = () => {
  const { pathname } = useLocation()
  const { chainId: connectedChainId } = useWeb3React()
  const chainName = chainIdToBackendName(connectedChainId)

  const isPoolActive = useIsPoolsPage()
  const isNftPage = useIsNftPage()

  const shouldDisableNFTRoutes = useAtomValue(shouldDisableNFTRoutesAtom)

  const isMobile = useIsMobile();

  return (
    <>
      <MenuItem href="/swap" isActive={pathname.startsWith('/swap')}>
        {
          isMobile ? (
            <AutoColumn gap='2px' justify='center'>
              <PageTabIcon type='swap' active={pathname.startsWith('/swap')} />
              <Trans>Swap</Trans>
            </AutoColumn>
          ) : (
            <>
              <PageTabIcon type='swap' active={pathname.startsWith('/swap')} />
              <Trans>Swap</Trans>
            </>
          )
        }
      </MenuItem>
      <MenuItem href={`/tokens`} isActive={pathname.startsWith('/tokens')}>
        {
          isMobile ? (
            <AutoColumn gap='2px' justify='center'>
              <PageTabIcon type='tokens' active={pathname.startsWith('/tokens')} />
              <Trans>Tokens</Trans>
            </AutoColumn>
          ) : (
            <>
              <PageTabIcon type='tokens' active={pathname.startsWith('/tokens')} />
              <Trans>Tokens</Trans>
            </>
          )
        }
      </MenuItem>
      {/* {!shouldDisableNFTRoutes && (
        <MenuItem dataTestId="nft-nav" href="/nfts" isActive={isNftPage}>
          <Trans>NFTs</Trans>
        </MenuItem>
      )} */}
      {/* <Box display={{ sm: 'flex', lg: 'none', xxl: 'flex' }} width="full"> */}
      <MenuItem href="/pools" dataTestId="pool-nav-link" isActive={isPoolActive}>
        {
          isMobile ? (
            <AutoColumn gap='2px' justify='center'>
              <PageTabIcon type='pool' active={isPoolActive} />
              <Trans>Pools</Trans>
            </AutoColumn>
          ) : (
            <>
              <PageTabIcon type='pool' active={isPoolActive} />
              <Trans>Pools</Trans>
            </>
          )
        }
      </MenuItem>
      {/* </Box> */}
      {/* <Box display={{ sm: 'none', md: 'none', lg: 'flex', xl: 'none' }} marginY={{ sm: '4', md: 'unset' }}>
        <MenuDropdown />
      </Box> */}
    </>
  )
}

const Navbar = ({ blur }: { blur: boolean }) => {
  const isNftPage = useIsNftPage()
  const sellPageState = useProfilePageState((state) => state.state)
  const navigate = useNavigate()
  const isMobile = useIsMobile();

  return (
    <>
      {blur && <Blur />}
      <Nav isMobile={isMobile}>
        <Box display="flex" height="full" flexWrap="nowrap">
          <Box className={styles.leftSideContainer}>
            <Box className={styles.logoContainer}>
              <UniIcon
                width={isMobile ? 70 : 116}
                data-testid="uniswap-logo"
                className={styles.logo}
              // onClick={() => {
              //   navigate({
              //     pathname: '/',
              //     search: '?intro=true',
              //   })
              // }}
              />
            </Box>
            {/* {!isNftPage && (
              <Box display={{ sm: 'flex', lg: 'none' }}>
                <ChainSelector leftAlign={true} />
              </Box>
            )} */}
            <Row display={{ sm: 'none', lg: 'flex' }} gap='40'>
              <PageTabs />
            </Row>
          </Box>
          {/* <Box className={styles.searchContainer}>
            <SearchBar />
          </Box> */}
          <Box className={styles.rightSideContainer}>
            <Row gap={`${isMobile ? 8 : 16}`}>
              {/* <Box position="relative" display={{ sm: 'flex', navSearchInputVisible: 'none' }}>
                <SearchBar />
              </Box> */}
              {!isNftPage && (
                <Box display={{ sm: 'flex', lg: 'flex' }}>
                  <ChainSelector />
                </Box>
              )}

              <Web3Status />
            </Row>
          </Box>
        </Box>
      </Nav>
    </>
  )
}

export default Navbar
