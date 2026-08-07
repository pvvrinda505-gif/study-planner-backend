const express = require("express");
const pool = require("../db");

const router = express.Router();

// POST /subjects — creates a subject for a user if it doesn't already exist,
// or returns the existing one. Matches how your frontend assigns a color
// the first time a subject is seen (getSubjectColor in calendar.js).
router.post("/subjects", async (req, res) => {
  const { user_id, subject_name, bg_color, text_color } = req.body;

  if (!user_id || !subject_name) {
    return res.status(400).json({ error: "user_id and subject_name are required." });
  }

  try {
    const [existing] = await pool.query(
      "SELECT * FROM subjects WHERE user_id = ? AND subject_name = ?",
      [user_id, subject_name]
    );

    if (existing.length > 0) {
      return res.json({ subject: existing[0] });
    }

    const [result] = await pool.query(
      "INSERT INTO subjects (user_id, subject_name, bg_color, text_color) VALUES (?, ?, ?, ?)",
      [user_id, subject_name, bg_color || null, text_color || null]
    );

    res.status(201).json({
      subject: { subject_id: result.insertId, user_id, subject_name, bg_color, text_color },
    });
  } catch (err) {
    console.error("Create subject error:", err);
    res.status(500).json({ error: "Server error creating subject." });
  }
});

// GET /subjects?user_id=123 — list all subjects for a user (Select Subject buttons)
router.get("/subjects", async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "user_id is required." });

  try {
    const [rows] = await pool.query("SELECT * FROM subjects WHERE user_id = ?", [user_id]);
    res.json(rows);
  } catch (err) {
    console.error("List subjects error:", err);
    res.status(500).json({ error: "Server error fetching subjects." });
  }
});

module.exports = router;
