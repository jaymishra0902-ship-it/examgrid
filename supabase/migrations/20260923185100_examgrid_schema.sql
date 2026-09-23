/*
# ExamGrid Schema - Student Life OS & Academic Command Center

1. New Tables
- `profiles`: Extends auth.users with student info (full_name, target_exam, avatar_initials)
- `syllabus_topics`: Per-user syllabus topics with status tracking (not_started, in_progress, mastered) across 4 subjects
- `exam_dates`: Per-user exam countdown dates
- `daily_targets`: Per-user daily top 3 study targets with priority levels
- `study_streaks`: Per-user study streak tracking (current streak, longest streak, last study date)

2. Security
- RLS enabled on all tables
- Owner-scoped CRUD policies (auth.uid() = user_id) for authenticated users
- All owner columns default to auth.uid()

3. Notes
- Profiles table uses ON DELETE CASCADE to auth.users
- Syllabus topics seeded with default topics per subject on first load (handled in app)
- Daily targets scoped to current date for display
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT 'Student',
  target_exam text NOT NULL DEFAULT 'Class 12 Boards',
  avatar_color text NOT NULL DEFAULT '#000000',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Syllabus topics table
CREATE TABLE IF NOT EXISTS syllabus_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic_name text NOT NULL,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'mastered')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE syllabus_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_topics" ON syllabus_topics;
CREATE POLICY "select_own_topics" ON syllabus_topics FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_topics" ON syllabus_topics;
CREATE POLICY "insert_own_topics" ON syllabus_topics FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_topics" ON syllabus_topics;
CREATE POLICY "update_own_topics" ON syllabus_topics FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_topics" ON syllabus_topics;
CREATE POLICY "delete_own_topics" ON syllabus_topics FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Exam dates table
CREATE TABLE IF NOT EXISTS exam_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_name text NOT NULL,
  exam_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exam_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_exams" ON exam_dates;
CREATE POLICY "select_own_exams" ON exam_dates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_exams" ON exam_dates;
CREATE POLICY "insert_own_exams" ON exam_dates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_exams" ON exam_dates;
CREATE POLICY "update_own_exams" ON exam_dates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_exams" ON exam_dates;
CREATE POLICY "delete_own_exams" ON exam_dates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Daily targets table
CREATE TABLE IF NOT EXISTS daily_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  completed boolean NOT NULL DEFAULT false,
  target_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_targets" ON daily_targets;
CREATE POLICY "select_own_targets" ON daily_targets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_targets" ON daily_targets;
CREATE POLICY "insert_own_targets" ON daily_targets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_targets" ON daily_targets;
CREATE POLICY "update_own_targets" ON daily_targets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_targets" ON daily_targets;
CREATE POLICY "delete_own_targets" ON daily_targets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Study streaks table
CREATE TABLE IF NOT EXISTS study_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_study_date date,
  total_study_days integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE study_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_streak" ON study_streaks;
CREATE POLICY "select_own_streak" ON study_streaks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_streak" ON study_streaks;
CREATE POLICY "insert_own_streak" ON study_streaks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_streak" ON study_streaks;
CREATE POLICY "update_own_streak" ON study_streaks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_user_id ON syllabus_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_dates_user_id ON exam_dates(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_targets_user_id ON daily_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_study_streaks_user_id ON study_streaks(user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, target_exam)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student'), COALESCE(NEW.raw_user_meta_data->>'target_exam', 'Class 12 Boards'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();