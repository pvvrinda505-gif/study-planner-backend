const express = require("express");
const pool = require("../db");

const router = express.Router();

// POST /pomodoro-logs — called once per completed 25-minute round.
// Instead of creating a new row every round, this keeps ONE row per
// session and increments minutes_completed on it each time — so 25, then
// another 25, becomes a single row showing 50, not two rows of 25.
// Requires a UNIQUE key on session_id (see migration in the schema notes).
router.post("/pomodoro-logs", async (req, res) => {
  const { session_id, start_time, end_time, minutes_completed } = req.body;

  if (!session_id || !start_time || !end_time || minutes_completed == null) {
    return res.status(400).json({
      error: "session_id, start_time, end_time, and minutes_completed are required.",
    });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO pomodoro_logs (session_id, start_time, end_time, minutes_completed)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         end_time = VALUES(end_time),
         minutes_completed = minutes_completed + VALUES(minutes_completed)`,
      [session_id, start_time, end_time, minutes_completed]
    );

    res.status(201).json({ message: "Pomodoro round logged" });
  } catch (err) {
    console.error("Log pomodoro error:", err);
    res.status(500).json({ error: "Server error logging Pomodoro round." });
  }
});

// GET /pomodoro-logs/subject/:subject_id — replaces subjectStats:
// returns total completed minutes + round count for one subject,
// summed across every session under it.
router.get("/pomodoro-logs/subject/:subject_id", async (req, res) => {
  const { subject_id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT
         COALESCE(SUM(pl.minutes_completed), 0) AS completed_minutes,
         COUNT(*) AS pomodoro_completed
       FROM pomodoro_logs pl
       JOIN sessions s ON s.session_id = pl.session_id
       WHERE s.subject_id = ?`,
      [subject_id]
    );

    res.json(rows[0]); // { completed_minutes, pomodoro_completed }
  } catch (err) {
    console.error("Fetch pomodoro stats error:", err);
    res.status(500).json({ error: "Server error fetching Pomodoro stats." });
  }
});

module.exports = router;
