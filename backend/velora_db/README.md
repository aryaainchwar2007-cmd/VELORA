# Velora Database

This folder contains a fresh PostgreSQL database design for the Velora project described in the presentation.

## What this schema covers

- Student onboarding with preferred language and skill level
- Multilingual question delivery and localized explanations
- Voice input with Whisper-style speech-to-text transcript storage
- IRT-oriented adaptive practice using problem difficulty and student concept mastery
- Code editor submissions, evaluation results, and instant feedback
- Gamification through points, achievements, streaks, and leaderboard seasons
- QR-backed completion certificates
- Progress analytics for future teacher dashboards and review planning

## Files

- [schema.sql](C:\Users\Omkar Patil\OneDrive\Documents\velora_db\schema.sql): main PostgreSQL schema, constraints, indexes, and a summary view
- [seed.sql](C:\Users\Omkar Patil\OneDrive\Documents\velora_db\seed.sql): starter reference data for languages, skill levels, concepts, achievements, and a default leaderboard season

## Assumptions

- The extractable slide content clearly described implementation flow, benefits, and future scope.
- Slide bodies for problem statement, proposed solution, and technology stack were not available as normal text in the `.pptx`, so the database design is inferred from the implementation details that were extractable.
- PostgreSQL was chosen because Velora needs strong relational integrity plus JSON support for analytics metadata and scalable future features.

## Suggested setup

```sql
\i schema.sql
\i seed.sql
```

## Core design notes

- `student_concept_mastery` stores per-concept adaptive learning state for each student.
- `session_question` captures the IRT decision trail for each asked question.
- `audio_capture` stores voice interaction metadata without forcing audio blobs into the database.
- `ai_explanation` separates multilingual explanation history from raw submissions.
- `progress_event` provides a flexible analytics/event stream for dashboards and future experimentation.

## Good next additions

- Add sample student data and practice problems.
- Add stored procedures for updating mastery after each submission.
- Add a plagiarism table if you want to implement that future-scope feature.
- Add row-level security if this will be deployed as a multi-tenant product.
