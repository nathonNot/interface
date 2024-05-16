import React from "react";
import { Trans } from '@lingui/macro';
import EmptyImg from 'assets/images/empty.png';
import styled from "styled-components";
import { useIsMobile } from "nft/hooks";

const Container = styled.div<{ isMobile: boolean }>`
  margin: ${({ isMobile }) => `${isMobile ? 66 : 0}px`} auto;
  font-size: ${({ isMobile }) => `${isMobile ? 16 : 24}px`};
  font-weight: 500;
  color: #726FA7;
  text-align: center;

  & > img {
    width: ${({ isMobile }) => `${isMobile ? 150 : 260}px`};
    margin-bottom: 32px;
  }
`

const Empty = () => {
  const isMobile = useIsMobile();
  return (
    <Container isMobile={isMobile}>
      <img src={EmptyImg} />
      <div>You have no assets yet</div>
    </Container>
  )
}

export default React.memo(Empty);