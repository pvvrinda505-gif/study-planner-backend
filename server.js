require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const subjectRoutes = require("./routes/subjects");
const sessionRoutes = require("./routes/sessions");
const pomodoroRoutes = require("./routes/pomodoro");
const calendarRoutes = require("./routes/calendar");

const app = express();

app.use(cors());
app.use(express.json());

// Health check — visiting the base URL confirms the server is alive
app.get("/", (req, res) => {
  res.send("SmartStudyPlanner backend is running ✅ (MySQL / Railway)");
});

app.use("/", authRoutes);      // /register, /login
app.use("/", subjectRoutes);   // /subjects
app.use("/", sessionRoutes);   // /sessions
app.use("/", pomodoroRoutes);  // /pomodoro-logs
app.use("/", calendarRoutes);  // /calendar

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
