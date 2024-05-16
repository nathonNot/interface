import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Input from 'components/NumericalInput'
import { BodyWrapper } from 'pages/AppBody'
import styled from 'styled-components/macro'

export const Wrapper = styled.div`
  position: relative;
  // padding: 26px 16px;
  min-width: 480px;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    min-width: 400px;
  `};

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToExtraSmall`
  min-width: 340px;
`};
`

export const ScrollablePage = styled.div`
  padding: 68px 16px;
  position: relative;
  display: flex;
  flex-direction: column;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    max-width: 480px;
    margin: 0 auto;
  `};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: 48px 16px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`

export const DynamicSection = styled(AutoColumn)<{ disabled?: boolean }>`
  opacity: ${({ disabled }) => (disabled ? '0.2' : '1')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'initial')};
`

export const CurrencyDropdown = styled(CurrencyInputPanel)`
  width: 48.5%;
`

export const StyledInput = styled(Input)`
  background-color: ${({ theme }) => theme.backgroundSurface};
  text-align: left;
  font-size: 18px;
  width: 100%;
`

/* two-column layout where DepositAmount is moved at the very end on mobile. */
export const ResponsiveTwoColumns = styled.div<{ wide: boolean }>`
  display: grid;
  // grid-column-gap: 50px;
  // grid-row-gap: 15px;
  // grid-template-columns: ${({ wide }) => (wide ? '1fr 1fr' : '1fr')};
  grid-template-columns: 1fr 1fr;
  grid-template-rows: max-content;
  grid-auto-flow: row;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    grid-template-columns: 1fr;

    margin-top: 0;
  `};
`

export const RightContainer = styled(AutoColumn)<{ isMobile?: boolean }>`
  grid-row: 1 / 3;
  grid-column: 2;
  height: 100%;
  padding: 24px;
  padding: ${({ isMobile }) => `24px ${isMobile ? 16 : 24}px`};

  border-left: 1px solid #312E63;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
  grid-row: 2 / 3;
  grid-column: 1;
  `};
`

export const StackedContainer = styled.div`
  display: grid;
`

export const StackedItem = styled.div<{ zIndex?: number }>`
  grid-column: 1;
  grid-row: 1;
  height: 100%;
  z-index: ${({ zIndex }) => zIndex};
`

export const MediumOnly = styled.div`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    display: none;
  `};
`

export const HideMedium = styled.div`
  display: none;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    display: block;
  `};
`
