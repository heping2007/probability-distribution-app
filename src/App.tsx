// React import might not be needed in newer versions, but kept for compatibility
import './App.css'
import DataAnalysisApp from './components/DataAnalysisApp'

function App() {
  return (
    <div className="app-container">
      {/* Background particle effect */}
      <div className="background-particles" />
      {/* Main content area */}
      <div className="main-content">
        <DataAnalysisApp />
      </div>
    </div>
  )
}

export default App
