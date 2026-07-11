import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Docs from './Docs.tsx'

const isDocs = window.location.pathname === '/docs' || window.location.pathname === '/docs/';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isDocs ? <Docs /> : <App />}
  </StrictMode>,
)
