BEGIN;

INSERT INTO supported_language (language_code, language_name, is_indic) VALUES
('en', 'English', FALSE),
('hi', 'Hindi', TRUE),
('ta', 'Tamil', TRUE),
('te', 'Telugu', TRUE),
('mr', 'Marathi', TRUE),
('kn', 'Kannada', TRUE),
('bn', 'Bengali', TRUE);

INSERT INTO skill_level (level_code, level_name, rank_order, description) VALUES
('beginner', 'Beginner', 1, 'New learner with little or no coding background'),
('intermediate', 'Intermediate', 2, 'Comfortable with basics and simple problem solving'),
('advanced', 'Advanced', 3, 'Ready for higher difficulty and timed coding practice');

INSERT INTO coding_language (language_name, language_version) VALUES
('Python', '3.11'),
('Java', '21'),
('C++', '17');

INSERT INTO concept (concept_code, concept_name, description, default_difficulty) VALUES
('variables', 'Variables and Data Types', 'Basic data storage, primitive values, and type understanding', 0.20),
('operators', 'Operators and Expressions', 'Arithmetic, comparison, and logical operators', 0.25),
('conditionals', 'Conditional Logic', 'if/else branching and decision making', 0.35),
('loops', 'Loops', 'Iteration using for and while patterns', 0.40),
('functions', 'Functions', 'Reusable logic blocks, parameters, and return values', 0.45),
('arrays', 'Arrays and Lists', 'Indexed storage, traversal, and common list operations', 0.50),
('strings', 'Strings', 'String traversal, formatting, and transformations', 0.42),
('debugging', 'Debugging Basics', 'Reading errors, tracing state, and fixing simple bugs', 0.38);

INSERT INTO learning_path (path_name, description, target_skill_level_id) VALUES
('Coding Foundations', 'Starter path for multilingual beginners learning to code through guided practice', 1),
('Problem Solving Sprint', 'Adaptive practice path focused on strengthening weak concepts', 2);

INSERT INTO learning_path_concept (learning_path_id, concept_id, sequence_no)
SELECT lp.learning_path_id, c.concept_id, seq.sequence_no
FROM learning_path lp
JOIN (
    VALUES
        ('variables', 1),
        ('operators', 2),
        ('conditionals', 3),
        ('loops', 4),
        ('functions', 5),
        ('arrays', 6),
        ('strings', 7),
        ('debugging', 8)
) AS seq(concept_code, sequence_no) ON TRUE
JOIN concept c ON c.concept_code = seq.concept_code
WHERE lp.path_name = 'Coding Foundations';

INSERT INTO achievement (achievement_code, achievement_name, description, points_reward) VALUES
('first_login', 'First Step', 'Complete onboarding and start the first learning session', 10),
('streak_7', 'Seven Day Spark', 'Maintain a seven day practice streak', 50),
('concept_master', 'Concept Master', 'Reach 90 percent mastery in any one concept', 100),
('top_10', 'Leaderboard Climber', 'Finish a leaderboard season in the top 10', 150);

INSERT INTO leaderboard_season (season_name, starts_at, ends_at, is_active) VALUES
('Launch Season', NOW(), NOW() + INTERVAL '30 days', TRUE);

COMMIT;
