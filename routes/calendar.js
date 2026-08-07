const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET /calendar?user_id=123&year=2026&month=8
// Powers the Calendar page grid — returns every session for that month
// regardless of completed/deleted status, matching how calendar.js
// currently reads the permanent "studyHistory" list.
router.get("/calendar", async (req, res) => {
  const { user_id, year, month } = req.query;

  if (!user_id || !year || !month) {
    return res.status(400).json({ error: "user_id, year, and month are required." });
  }

  try {
    const [rows] = await pool.query(
      `SELECT s.*, sub.subject_name, sub.bg_color, sub.text_color
       FROM sessions s
       JOIN subjects sub ON sub.subject_id = s.subject_id
       WHERE sub.user_id = ?
         AND YEAR(s.planned_date) = ?
         AND MONTH(s.planned_date) = ?
       ORDER BY s.planned_date ASC`,
      [user_id, year, month]
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch calendar error:", err);
    res.status(500).json({ error: "Server error fetching calendar data." });
  }
});

// POST /calendar/log — OPTIONAL: records an audit-trail entry for exactly
// when a session was marked complete (separate from the calendar grid above).
router.post("/calendar/log", async (req, res) => {
  const { session_id, completed_at, duration, topic } = req.body;

  if (!session_id || !completed_at || duration == null || !topic) {
    return res.status(400).json({
      error: "session_id, completed_at, duration, and topic are required.",
    });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO calendar (session_id, completed_at, duration, topic)
       VALUES (?, ?, ?, ?)`,
      [session_id, completed_at, duration, topic]
    );
    res.status(201).json({ message: "Completion logged", calendar_id: result.insertId });
  } catch (err) {
    console.error("Log calendar entry error:", err);
    res.status(500).json({ error: "Server error logging completion." });
  }
});

module.exports = router;
