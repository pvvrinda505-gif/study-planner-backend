const express = require("express");
const pool = require("../db");

const router = express.Router();

// POST /sessions — matches planner.js's "Add Study Session" form
router.post("/sessions", async (req, res) => {
  const { subject_id, topic, duration, planned_date, planned_time } = req.body;

  if (!subject_id || !topic || duration == null) {
    return res.status(400).json({ error: "subject_id, topic, and duration are required." });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO sessions (subject_id, topic, duration, planned_date, planned_time)
       VALUES (?, ?, ?, ?, ?)`,
      [subject_id, topic, duration, planned_date || null, planned_time || null]
    );

    res.status(201).json({
      message: "Session created",
      session_id: result.insertId,
    });
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({ error: "Server error creating session." });
  }
});

// GET /sessions?user_id=123&includeDeleted=false
// Used by BOTH Planner (includeDeleted=false) and Calendar (includeDeleted=true,
// since Calendar shows permanent history regardless of Planner deletes).
router.get("/sessions", async (req, res) => {
  const { user_id, includeDeleted } = req.query;
  if (!user_id) return res.status(400).json({ error: "user_id is required." });

  try {
    const showDeleted = includeDeleted === "true";
    const sql = `
      SELECT s.*, sub.subject_name, sub.bg_color, sub.text_color
      FROM sessions s
      JOIN subjects sub ON sub.subject_id = s.subject_id
      WHERE sub.user_id = ?
      ${showDeleted ? "" : "AND s.deleted = FALSE"}
      ORDER BY s.created_at DESC
    `;
    const [rows] = await pool.query(sql, [user_id]);
    res.json(rows);
  } catch (err) {
    console.error("List sessions error:", err);
    res.status(500).json({ error: "Server error fetching sessions." });
  }
});

// PATCH /sessions/:id/complete — matches the Planner "Complete" button
router.patch("/sessions/:id/complete", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE sessions SET completed = TRUE WHERE session_id = ?", [id]);
    res.json({ message: "Session marked complete" });
  } catch (err) {
    console.error("Complete session error:", err);
    res.status(500).json({ error: "Server error updating session." });
  }
});

// DELETE /sessions/:id — soft delete, matches the Planner "Delete" button
// (sets deleted = TRUE rather than removing the row, so Calendar history stays intact)
router.delete("/sessions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE sessions SET deleted = TRUE WHERE session_id = ?", [id]);
    res.json({ message: "Session deleted" });
  } catch (err) {
    console.error("Delete session error:", err);
    res.status(500).json({ error: "Server error deleting session." });
  }
});

module.exports = router;
