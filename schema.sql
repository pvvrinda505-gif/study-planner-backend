-- ============================================================
-- SmartStudyPlanner — Final Database Schema (MySQL)
-- ============================================================

-- 1) USERS
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2) SUBJECTS
-- Color columns absorb what would otherwise be a separate subject_colors table.
CREATE TABLE IF NOT EXISTS subjects (
  subject_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject_name VARCHAR(100) NOT NULL,
  bg_color VARCHAR(20),
  text_color VARCHAR(20),
  UNIQUE KEY unique_user_subject (user_id, subject_name),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3) SESSIONS  (Planner)
CREATE TABLE IF NOT EXISTS sessions (
  session_id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  topic VARCHAR(255) NOT NULL,
  duration INT NOT NULL,          -- minutes
  planned_date DATE,
  planned_time VARCHAR(20),       -- e.g. "10:45 AM" — matches your current session.time field
  completed BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4) POMODORO LOGS
-- One row PER completed 25-minute round — this is what actually drives
-- your Dashboard's "Progress" bar and "Sessions Completed" counter.
-- Sum minutes_completed / COUNT(*) per subject to get the totals you
-- currently store in subjectStats — but here you keep full history too.
CREATE TABLE IF NOT EXISTS pomodoro_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  minutes_completed INT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5) CALENDAR  (completion audit log — NOT what the Calendar page reads
-- from day-to-day; see note below. Optional, but useful for a "history of
-- exactly when things got marked done" feature later.)
CREATE TABLE IF NOT EXISTS calendar (
  calendar_id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  completed_at DATETIME NOT NULL,
  duration INT NOT NULL,
  topic VARCHAR(255) NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Example queries your app will actually run day-to-day
-- ============================================================

-- Calendar page: everything for a given month, regardless of completed status
-- SELECT s.*, sub.subject_name, sub.bg_color, sub.text_color
-- FROM sessions s
-- JOIN subjects sub ON sub.subject_id = s.subject_id
-- WHERE sub.user_id = ? AND MONTH(s.planned_date) = ?;

-- Dashboard "Progress" for a subject: sum of all completed Pomodoro minutes
-- SELECT COALESCE(SUM(pl.minutes_completed), 0) AS completed_minutes,
--        COUNT(*) AS pomodoro_completed
-- FROM pomodoro_logs pl
-- JOIN sessions s ON s.session_id = pl.session_id
-- WHERE s.subject_id = ?;
