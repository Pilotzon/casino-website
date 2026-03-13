const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

// Import database
const { db } = require("./config/database");

// Import routes
const authRoutes = require("./routes/auth");
const gamesRoutes = require("./routes/games");
const stocksRoutes = require("./routes/stocks");
const customBetsRoutes = require("./routes/customBets");
const dashboardRoutes = require("./routes/dashboard");
const adminRoutes = require("./routes/admin");
const pagesRoutes = require("./routes/pages");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Middleware
 */

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://your-frontend-domain.com"
        : "http://localhost:3000",
    credentials: true,
  })
);

const { initializeDatabase, initializeGames, initializeSettings } = require("./config/database");
initializeDatabase();
initializeGames();
initializeSettings();

// ✅ Serve uploaded files (custom bets images)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", globalLimiter);

// Request logging (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

/**
 * Routes
 */

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

console.log("ROUTES TYPES", {
  authRoutes: typeof authRoutes,
  gamesRoutes: typeof gamesRoutes,
  stocksRoutes: typeof stocksRoutes,
  customBetsRoutes: typeof customBetsRoutes,
  dashboardRoutes: typeof dashboardRoutes,
  adminRoutes: typeof adminRoutes,
  pagesRoutes: typeof pagesRoutes,
});

console.log("ROUTES KEYS", {
  authRoutes: authRoutes && Object.keys(authRoutes),
  gamesRoutes: gamesRoutes && Object.keys(gamesRoutes),
  stocksRoutes: stocksRoutes && Object.keys(stocksRoutes),
  customBetsRoutes: customBetsRoutes && Object.keys(customBetsRoutes),
  dashboardRoutes: dashboardRoutes && Object.keys(dashboardRoutes),
  adminRoutes: adminRoutes && Object.keys(adminRoutes),
  pagesRoutes: pagesRoutes && Object.keys(pagesRoutes),
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/stocks", stocksRoutes);
app.use("/api/custom-bets", customBetsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pages", pagesRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Casino Platform API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      games: "/api/games",
      stocks: "/api/stocks",
      customBets: "/api/custom-bets",
      dashboard: "/api/dashboard",
      admin: "/api/admin",
      pages: "/api/pages",
      uploads: "/uploads",
    },
  });
});

// 404 handler - MUST be last
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.path,
  });
});

/**
 * Error handling
 */
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  if (error.code === "SQLITE_CONSTRAINT") {
    return res.status(400).json({
      success: false,
      message: "Database constraint violation",
    });
  }

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
  });
});

/**
 * Background tasks
 */
const StockService = require("./services/stockService");
setInterval(async () => {
  try {
    await StockService.resolvePendingBets();
  } catch (error) {
    console.error("Stock bet resolution error:", error);
  }
}, 60000);

/**
 * Start server
 */
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server gracefully...");
  server.close(() => {
    console.log("Server closed");
    db.close();
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\nSIGINT received, closing server gracefully...");
  server.close(() => {
    console.log("Server closed");
    db.close();
    process.exit(0);
  });
});

const server = app.listen(PORT, () => {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║                                                        ║");
  console.log("║       🎰 CASINO PLATFORM - BACKEND SERVER 🎰          ║");
  console.log("║                                                        ║");
  console.log("╠════════════════════════════════════════════════════════╣");
  console.log(`║  Server running on: http://localhost:${PORT}`.padEnd(57) + "║");
  console.log(`║  Environment: ${process.env.NODE_ENV || "development"}`.padEnd(57) + "║");
  console.log("║                                                        ║");
  console.log("║  API Endpoints:                                        ║");
  console.log(`║  • Health: http://localhost:${PORT}/api/health`.padEnd(57) + "║");
  console.log(`║  • Auth: http://localhost:${PORT}/api/auth`.padEnd(57) + "║");
  console.log(`║  • Games: http://localhost:${PORT}/api/games`.padEnd(57) + "║");
  console.log(`║  • Stocks: http://localhost:${PORT}/api/stocks`.padEnd(57) + "║");
  console.log(`║  • Custom Bets: http://localhost:${PORT}/api/custom-bets`.padEnd(57) + "║");
  console.log(`║  • Dashboard: http://localhost:${PORT}/api/dashboard`.padEnd(57) + "║");
  console.log(`║  • Admin: http://localhost:${PORT}/api/admin`.padEnd(57) + "║");
  console.log(`║  • Pages: http://localhost:${PORT}/api/pages`.padEnd(57) + "║");
  console.log(`║  • Uploads: http://localhost:${PORT}/uploads`.padEnd(57) + "║");
  console.log("║                                                        ║");
  console.log("╠════════════════════════════════════════════════════════╣");
  console.log("║  ⚠️  REMEMBER:                                          ║");
  console.log("║  • Virtual credits only - no real money               ║");
  console.log("║  • For private use between friends only               ║");
  console.log("╚════════════════════════════════════════════════════════╝");
});

module.exports = app;