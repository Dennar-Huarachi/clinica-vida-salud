import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Estilos globales: primero las variables, luego las reglas base.
import './compartido/estilos/variables.css'
import './compartido/estilos/base.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
