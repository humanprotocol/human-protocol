import { Route, Routes } from 'react-router-dom'

import Landing from './Landing'
import VotePage from './VotePage'

export default function Vote() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path=":governorIndex/:id" element={<VotePage />} />
    </Routes>
  )
}
