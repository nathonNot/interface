import { AutoColumn } from 'components/Column'
import PositionListItem from 'components/PositionListItem'
import React from 'react'
import { PositionDetails } from 'types/position'

type PositionListProps = React.PropsWithChildren<{
  positions: PositionDetails[]
}>

export default function PositionList({
  positions,
}: PositionListProps) {
  return (
    <AutoColumn gap='32px'>
      {positions.map((p) => (
        <PositionListItem key={p.tokenId.toString()} {...p} />
      ))}
    </AutoColumn>
  )
}
