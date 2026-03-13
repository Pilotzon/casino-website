const { db } = require("../config/database");

function canBypass(req) {
  const u = req.user;
  if (!u) return false;
  if (u.role === "owner") return true;
  return Boolean(u.can_bypass_disabled);
}

class PagesController {
  static async getPages(req, res) {
    try {
      const bypass = canBypass(req);
      const rows = db
        .prepare(`SELECT page_key, display_name, is_enabled, updated_at FROM pages ORDER BY page_key`)
        .all();

      res.json({ success: true, data: rows, meta: { bypass } });
    } catch (e) {
      console.error("Pages get error:", e);
      res.status(500).json({ success: false, message: "Failed to fetch pages" });
    }
  }
}

module.exports = PagesController;