import React from "react";
import { Trans } from '@lingui/macro';
import EmptyImg from 'assets/images/empty.png';
import styled from "styled-components";

const Container = styled.div`
  margin: 140px auto;
  font-size: 24px;
  font-weight: 500;
  color: #726FA7;
`

const Img = styled.img`
  width: 260px;
  margin-bottom: 32px;
`

const Empty = () => {
  return (
    <Container>
      <Img src={EmptyImg} />
      <div>You have no assets yet</div>
    </Container>
  )
}

export default React.memo(Empty);