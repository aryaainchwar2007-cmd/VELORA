BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('student', 'teacher', 'mentor', 'admin');
CREATE TYPE input_mode AS ENUM ('text', 'voice');
CREATE TYPE session_status AS ENUM ('created', 'active', 'completed', 'abandoned');
CREATE TYPE submission_status AS ENUM ('pending', 'evaluated', 'accepted', 'rejected', 'runtime_error');
CREATE TYPE explanation_trigger AS ENUM ('wrong_answer', 'hint_request', 'concept_review', 'code_feedback');
CREATE TYPE certificate_status AS ENUM ('issued', 'revoked', 'expired');

CREATE TABLE supported_language (
    language_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code VARCHAR(10) NOT NULL UNIQUE,
    language_name VARCHAR(100) NOT NULL,
    is_indic BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE skill_level (
    skill_level_id SMALLSERIAL PRIMARY KEY,
    level_code VARCHAR(30) NOT NULL UNIQUE,
    level_name VARCHAR(50) NOT NULL,
    rank_order SMALLINT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE app_user (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    preferred_language_id UUID REFERENCES supported_language(language_id),
    skill_level_id SMALLINT REFERENCES skill_level(skill_level_id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_profile (
    user_id UUID PRIMARY KEY REFERENCES app_user(user_id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    school_or_college VARCHAR(200),
    grade_or_year VARCHAR(30),
    total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
    current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
    onboarding_completed_at TIMESTAMPTZ,
    linkedin_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE coding_language (
    coding_language_id SMALLSERIAL PRIMARY KEY,
    language_name VARCHAR(50) NOT NULL UNIQUE,
    language_version VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE concept (
    concept_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_code VARCHAR(50) NOT NULL UNIQUE,
    concept_name VARCHAR(120) NOT NULL,
    description TEXT,
    parent_concept_id UUID REFERENCES concept(concept_id),
    default_difficulty NUMERIC(4,2) NOT NULL DEFAULT 0.50 CHECK (default_difficulty BETWEEN 0 AND 1),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE learning_path (
    learning_path_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    target_skill_level_id SMALLINT REFERENCES skill_level(skill_level_id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE learning_path_concept (
    learning_path_id UUID NOT NULL REFERENCES learning_path(learning_path_id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES concept(concept_id) ON DELETE CASCADE,
    sequence_no INTEGER NOT NULL CHECK (sequence_no > 0),
    PRIMARY KEY (learning_path_id, concept_id),
    UNIQUE (learning_path_id, sequence_no)
);

CREATE TABLE practice_problem (
    problem_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_code VARCHAR(50) NOT NULL UNIQUE,
    concept_id UUID NOT NULL REFERENCES concept(concept_id),
    title VARCHAR(200) NOT NULL,
    prompt_text TEXT NOT NULL,
    problem_type VARCHAR(30) NOT NULL DEFAULT 'coding',
    difficulty_score NUMERIC(4,2) NOT NULL CHECK (difficulty_score BETWEEN 0 AND 1),
    irt_discrimination NUMERIC(5,2) NOT NULL DEFAULT 1.00 CHECK (irt_discrimination >= 0),
    irt_guessing NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (irt_guessing BETWEEN 0 AND 1),
    default_coding_language_id SMALLINT REFERENCES coding_language(coding_language_id),
    expected_time_seconds INTEGER CHECK (expected_time_seconds > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE problem_localization (
    problem_id UUID NOT NULL REFERENCES practice_problem(problem_id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES supported_language(language_id),
    localized_title VARCHAR(200) NOT NULL,
    localized_prompt TEXT NOT NULL,
    explanation_template TEXT,
    PRIMARY KEY (problem_id, language_id)
);

CREATE TABLE problem_test_case (
    test_case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES practice_problem(problem_id) ON DELETE CASCADE,
    input_data TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample BOOLEAN NOT NULL DEFAULT FALSE,
    weight NUMERIC(5,2) NOT NULL DEFAULT 1.00 CHECK (weight > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_concept_mastery (
    mastery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES concept(concept_id) ON DELETE CASCADE,
    theta_score NUMERIC(6,3) NOT NULL DEFAULT 0.000,
    mastery_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (mastery_percent BETWEEN 0 AND 100),
    last_difficulty_score NUMERIC(4,2) CHECK (last_difficulty_score BETWEEN 0 AND 1),
    questions_attempted INTEGER NOT NULL DEFAULT 0 CHECK (questions_attempted >= 0),
    correct_attempts INTEGER NOT NULL DEFAULT 0 CHECK (correct_attempts >= 0),
    next_review_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, concept_id),
    CHECK (correct_attempts <= questions_attempted)
);

CREATE TABLE practice_session (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    learning_path_id UUID REFERENCES learning_path(learning_path_id),
    input_mode input_mode NOT NULL,
    status session_status NOT NULL DEFAULT 'created',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    device_type VARCHAR(30),
    source_platform VARCHAR(30) NOT NULL DEFAULT 'web',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE TABLE session_question (
    session_question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES practice_session(session_id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES practice_problem(problem_id),
    concept_id UUID NOT NULL REFERENCES concept(concept_id),
    selected_language_id UUID REFERENCES supported_language(language_id),
    question_sequence INTEGER NOT NULL CHECK (question_sequence > 0),
    recommended_difficulty NUMERIC(4,2) NOT NULL CHECK (recommended_difficulty BETWEEN 0 AND 1),
    theta_before NUMERIC(6,3),
    theta_after NUMERIC(6,3),
    prompt_presented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    answered_at TIMESTAMPTZ,
    is_correct BOOLEAN,
    awarded_points INTEGER NOT NULL DEFAULT 0,
    UNIQUE (session_id, question_sequence)
);

CREATE TABLE audio_capture (
    audio_capture_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_question_id UUID NOT NULL REFERENCES session_question(session_question_id) ON DELETE CASCADE,
    original_file_uri TEXT,
    stt_provider VARCHAR(50) NOT NULL DEFAULT 'whisper',
    transcript_text TEXT,
    transcript_language_id UUID REFERENCES supported_language(language_id),
    confidence_score NUMERIC(4,3) CHECK (confidence_score BETWEEN 0 AND 1),
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE answer_submission (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_question_id UUID NOT NULL REFERENCES session_question(session_question_id) ON DELETE CASCADE,
    coding_language_id SMALLINT REFERENCES coding_language(coding_language_id),
    submitted_text TEXT,
    submitted_code TEXT,
    status submission_status NOT NULL DEFAULT 'pending',
    execution_time_ms INTEGER CHECK (execution_time_ms >= 0),
    memory_used_kb INTEGER CHECK (memory_used_kb >= 0),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE code_evaluation (
    evaluation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL UNIQUE REFERENCES answer_submission(submission_id) ON DELETE CASCADE,
    passed_test_cases INTEGER NOT NULL DEFAULT 0 CHECK (passed_test_cases >= 0),
    total_test_cases INTEGER NOT NULL DEFAULT 0 CHECK (total_test_cases >= 0),
    score_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (score_percent BETWEEN 0 AND 100),
    compiler_output TEXT,
    runtime_output TEXT,
    feedback_summary TEXT,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (passed_test_cases <= total_test_cases)
);

CREATE TABLE ai_explanation (
    explanation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_question_id UUID NOT NULL REFERENCES session_question(session_question_id) ON DELETE CASCADE,
    submission_id UUID REFERENCES answer_submission(submission_id) ON DELETE SET NULL,
    language_id UUID NOT NULL REFERENCES supported_language(language_id),
    trigger_reason explanation_trigger NOT NULL,
    explanation_text TEXT NOT NULL,
    model_name VARCHAR(100),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE leaderboard_season (
    season_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_name VARCHAR(100) NOT NULL UNIQUE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (ends_at > starts_at)
);

CREATE TABLE leaderboard_entry (
    season_id UUID NOT NULL REFERENCES leaderboard_season(season_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    rank_position INTEGER CHECK (rank_position > 0),
    points_earned INTEGER NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
    problems_solved INTEGER NOT NULL DEFAULT 0 CHECK (problems_solved >= 0),
    streak_days INTEGER NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (season_id, user_id)
);

CREATE TABLE achievement (
    achievement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_code VARCHAR(50) NOT NULL UNIQUE,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    points_reward INTEGER NOT NULL DEFAULT 0 CHECK (points_reward >= 0),
    badge_image_uri TEXT
);

CREATE TABLE student_achievement (
    user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievement(achievement_id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE completion_certificate (
    certificate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    learning_path_id UUID REFERENCES learning_path(learning_path_id),
    certificate_number VARCHAR(50) NOT NULL UNIQUE,
    qr_payload TEXT NOT NULL,
    pdf_uri TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status certificate_status NOT NULL DEFAULT 'issued',
    linkedin_shared_at TIMESTAMPTZ
);

CREATE TABLE progress_event (
    progress_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    session_id UUID REFERENCES practice_session(session_id) ON DELETE SET NULL,
    concept_id UUID REFERENCES concept(concept_id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_value NUMERIC(10,2),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_role ON app_user(role);
CREATE INDEX idx_problem_concept ON practice_problem(concept_id);
CREATE INDEX idx_mastery_user ON student_concept_mastery(user_id);
CREATE INDEX idx_mastery_review ON student_concept_mastery(next_review_at);
CREATE INDEX idx_session_user ON practice_session(user_id, started_at DESC);
CREATE INDEX idx_session_question_session ON session_question(session_id, question_sequence);
CREATE INDEX idx_submission_question ON answer_submission(session_question_id, submitted_at DESC);
CREATE INDEX idx_leaderboard_points ON leaderboard_entry(season_id, points_earned DESC);
CREATE INDEX idx_progress_event_user ON progress_event(user_id, created_at DESC);
CREATE INDEX idx_progress_event_type ON progress_event(event_type);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_app_user_updated_at
BEFORE UPDATE ON app_user
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_student_profile_updated_at
BEFORE UPDATE ON student_profile
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE VIEW v_student_progress_summary AS
SELECT
    u.user_id,
    u.full_name,
    sp.username,
    sl.language_name AS preferred_language,
    sk.level_name AS current_skill_level,
    sp.total_points,
    sp.current_streak,
    COUNT(DISTINCT ps.session_id) AS sessions_taken,
    COUNT(DISTINCT sq.session_question_id) AS questions_seen,
    COUNT(DISTINCT CASE WHEN sq.is_correct THEN sq.session_question_id END) AS correct_questions,
    COALESCE(AVG(scm.mastery_percent), 0) AS avg_mastery_percent
FROM app_user u
LEFT JOIN student_profile sp ON sp.user_id = u.user_id
LEFT JOIN supported_language sl ON sl.language_id = u.preferred_language_id
LEFT JOIN skill_level sk ON sk.skill_level_id = u.skill_level_id
LEFT JOIN practice_session ps ON ps.user_id = u.user_id
LEFT JOIN session_question sq ON sq.session_id = ps.session_id
LEFT JOIN student_concept_mastery scm ON scm.user_id = u.user_id
WHERE u.role = 'student'
GROUP BY
    u.user_id,
    u.full_name,
    sp.username,
    sl.language_name,
    sk.level_name,
    sp.total_points,
    sp.current_streak;

COMMIT;
