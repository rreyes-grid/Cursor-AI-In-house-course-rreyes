import { BrowserRouter, Routes, Route } from 'react-router'
import { DemoLayout } from './components/layout/DemoLayout'
import { Home } from './pages/Home'
import { demos } from './demos/registry'

import './demos'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DemoLayout />}>
          <Route index element={<Home />} />
          {demos.map((demo) => (
            <Route
              key={demo.path}
              path={demo.path}
              element={<demo.component />}
            />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
