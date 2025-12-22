-- English AI Database Initialization Script
-- Version: 1.0
-- Date: 2024-12-22

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE session_status AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');
CREATE TYPE error_type AS ENUM ('GRAMMAR', 'SPELLING', 'STRUCTURE', 'VOCABULARY', 'OTHER');

-- ============================================
-- Table: users
-- Description: Store user account information
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for email lookup
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- Table: writing_sessions
-- Description: Store writing practice sessions
-- ============================================
CREATE TABLE IF NOT EXISTS writing_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(200) NOT NULL,
    total_turns INT DEFAULT 0,
    status session_status DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for querying
CREATE INDEX idx_sessions_user_id ON writing_sessions(user_id);
CREATE INDEX idx_sessions_status ON writing_sessions(status);
CREATE INDEX idx_sessions_started_at ON writing_sessions(started_at DESC);

-- ============================================
-- Table: conversations
-- Description: Store individual conversation turns
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES writing_sessions(id) ON DELETE CASCADE,
    turn_number INT NOT NULL,
    ai_message TEXT NOT NULL,
    user_response TEXT,
    is_correct BOOLEAN,
    error_feedback TEXT,
    improvement_suggestion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_turn_number ON conversations(session_id, turn_number);

-- ============================================
-- Table: user_mistakes
-- Description: Store user mistakes for review
-- ============================================
CREATE TABLE IF NOT EXISTS user_mistakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    original_sentence TEXT NOT NULL,
    corrected_sentence TEXT NOT NULL,
    error_type error_type NOT NULL,
    error_explanation TEXT NOT NULL,
    is_reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_mistakes_user_id ON user_mistakes(user_id);
CREATE INDEX idx_mistakes_error_type ON user_mistakes(error_type);
CREATE INDEX idx_mistakes_is_reviewed ON user_mistakes(is_reviewed);
CREATE INDEX idx_mistakes_created_at ON user_mistakes(created_at DESC);

-- ============================================
-- Trigger: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Initial Data (Optional)
-- ============================================
-- You can add seed data here if needed

-- Comments
COMMENT ON TABLE users IS 'Stores user account information and authentication data';
COMMENT ON TABLE writing_sessions IS 'Tracks writing practice sessions with topics and status';
COMMENT ON TABLE conversations IS 'Stores individual conversation turns between user and AI';
COMMENT ON TABLE user_mistakes IS 'Archives user mistakes for review and learning';
