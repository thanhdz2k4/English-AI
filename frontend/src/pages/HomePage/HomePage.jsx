import './HomePage.css';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="container">
        <header className="hero">
          <h1>English AI</h1>
          <p className="tagline">Improve your English writing with AI-powered feedback</p>
        </header>

        <div className="features">
          <div className="feature-card">
            <div className="icon">✍️</div>
            <h3>Writing Practice</h3>
            <p>Practice writing English sentences with interactive AI conversations</p>
            <button className="btn btn-primary" onClick={() => navigate('/practice')}>
              Start Practice
            </button>
          </div>

          <div className="feature-card">
            <div className="icon">📊</div>
            <h3>Review Mistakes</h3>
            <p>Review and learn from your past mistakes to improve faster</p>
            <button className="btn btn-secondary" onClick={() => navigate('/review')}>
              View Mistakes
            </button>
          </div>
        </div>

        <div className="how-it-works">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <h4>Choose a Topic</h4>
              <p>Select any topic you want to practice</p>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <h4>Write & Learn</h4>
              <p>AI will check your grammar and provide feedback</p>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <h4>Improve</h4>
              <p>Review mistakes and track your progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
