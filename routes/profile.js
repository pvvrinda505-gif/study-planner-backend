const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");

const router = express.Router();

// GET /profile/:user_id — account info + subject list.
// (Study Preferences are handled client-side in localStorage, not stored
// here, so no pomodoro/break columns are queried.)
router.get("/profile/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const [userRows] = await pool.query(
      "SELECT user_id, name, email, created_at, avatar_url FROM users WHERE user_id = ?",
      [user_id]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const [subjects] = await pool.query(
      "SELECT subject_id, subject_name, bg_color, text_color FROM subjects WHERE user_id = ?",
      [user_id]
    );

    res.json({ ...userRows[0], subjects });
  } catch (err) {
    console.error("Fetch profile error:", err);
    res.status(500).json({ error: "Server error fetching profile." });
  }
});

// PATCH /profile/:user_id — edit name, email, and/or password
// Body: { name, email, currentPassword, newPassword }
router.patch("/profile/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { name, email, currentPassword, newPassword } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE user_id = ?", [user_id]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    let newHash = user.password_hash;
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required to set a new password." });
      }
      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: "Current password is incorrect." });
      }
      newHash = await bcrypt.hash(newPassword, 10);
    }

    if (email && email !== user.email) {
      const [existing] = await pool.query(
        "SELECT user_id FROM users WHERE email = ? AND user_id != ?",
        [email, user_id]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: "That email is already in use." });
      }
    }

    await pool.query(
      "UPDATE users SET name = ?, email = ?, password_hash = ? WHERE user_id = ?",
      [name || user.name, email || user.email, newHash, user_id]
    );

    res.json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Server error updating profile." });
  }
});

module.exports = router;
