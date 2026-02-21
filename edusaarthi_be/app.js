require('dotenv').config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var cors = require("cors");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var authRouter = require("./routes/auth");
var coursesRouter = require("./routes/courses");
var subjectsRouter = require("./routes/subjects");
var activitiesRouter = require("./routes/activities");
var recipientGroupsRouter = require("./routes/recipientGroups");
var batchesRouter = require("./routes/batches");
var assignmentsRouter = require("./routes/assignments");
var questionBankRouter = require("./routes/questionBank");
var { initScheduler } = require("./services/schedulerService");

var app = express();

// Connect to MongoDB
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("CRITICAL: MONGO_URI is not defined. Database connection will fail.");
} else {
  mongoose.connect(uri)
    .then(() => {
      console.log("Connected to MongoDB Atlas");
      initScheduler(); // Start the background task scheduler
    })
    .catch((err) => console.error("Error connecting to MongoDB:", err));
}

// No view engine needed for API

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

// DEBUG LOGGING
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/recipient-groups", recipientGroupsRouter);
app.use("/api/batches", batchesRouter);
app.use("/api/assignments", assignmentsRouter);
app.use("/api/question-bank", questionBankRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  const message = err.message;
  const error = req.app.get("env") === "development" ? err : {};

  // return JSON error
  res.status(err.status || 500).json({
    status: 'error',
    message: message,
    error: error
  });
});

module.exports = app;
