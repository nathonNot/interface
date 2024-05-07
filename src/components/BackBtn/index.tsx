import React from "react";
import styled from "styled-components";
import { Trans } from '@lingui/macro';
import { Link as HistoryLink, useLocation } from 'react-router-dom';
import { ArrowLeft } from "react-feather";

const StyledHistoryLink = styled(HistoryLink) <{ flex: string | undefined }>`
  display: flex;
  flex: ${({ flex }) => flex ?? 'none'};
  color: ${({ theme }) => theme.white};
  text-decoration: none;
  font-size: 24px;

  align-items: center;
  gap: 6px;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    flex: none;
    margin-right: 10px;
  `};
`

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${({ theme }) => theme.white};
  stroke: ${({ theme }) => theme.white};
`

const BackBtn = (props: { to: string; onClick?: () => void; style?: any; text: string; }) => {
  return (
    <StyledHistoryLink
      flex='1'
      {...props}
    >
      <StyledArrowLeft />
      {
        props.text && (<Trans>{props.text}</Trans>)
      }
      
    </StyledHistoryLink>
  )
}

export default React.memo(BackBtn);