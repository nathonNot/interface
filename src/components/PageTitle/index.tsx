import React from "react";
import styled from "styled-components";
import { fontSize } from "utils/userAgent";


type CenterProps = 'left' | 'center' | 'right';

const Container = styled.div<{ center?: CenterProps }>`
  text-align: ${({ center }) => center ?? 'left'}
`

const TitleContent = styled.div`
  font-size: ${fontSize * 2}px;
  font-weight: 600;
  line-height: 48px;
  color: ${({ theme }) => theme.white};
`

const DescContent = styled.div`
  margin-top: 4px;
  // font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: ${({ theme }) => theme.white};
`

const PageTilte = (props: { title: string; desc?: string; center?: CenterProps }) => {
  return (
    <Container {...props}>
      <TitleContent>{props.title}</TitleContent>
      {
        props.desc && <DescContent>{props.desc}</DescContent>
      }
    </Container>
  )
}

export default React.memo(PageTilte);