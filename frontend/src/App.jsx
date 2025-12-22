import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage/HomePage'
import WritingPracticePage from './pages/WritingPracticePage/WritingPracticePage'
import MistakeReviewPage from './pages/MistakeReviewPage/MistakeReviewPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/practice" element={<WritingPracticePage />} />
          <Route path="/review" element={<MistakeReviewPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
