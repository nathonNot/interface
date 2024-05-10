import Row from "components/Row"
import React from "react"
import styled from "styled-components"

const Btn = styled.div`
  user-select: none;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.primary};
  border-radius: 6px;
  padding: 3px 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.primary};
`

const ToggleButton = ({ text, onClick, symbol }: { text: string; onClick: () => void; symbol: string; }) => {
  return (
    <Row width='fit-content' gap='11px'>
      <div style={{ color: '#F4F4F4' }}>{text}</div>
      <Btn
        onClick={onClick}
      >
        {symbol}
      </Btn>
    </Row>
  )
}

export default React.memo(ToggleButton);