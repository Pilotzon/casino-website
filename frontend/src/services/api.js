import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("[API REQ]", config.method?.toUpperCase(), config.url, "token?", !!token);
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // ✅ If sending FormData, let browser set proper multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(
      "[API ERR]",
      error.config?.method?.toUpperCase(),
      error.config?.url,
      "status:",
      error.response?.status,
      "message:",
      error.response?.data?.message
    );

    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      if (url.includes("/auth/me") || url.includes("/auth/verify") || url.includes("/auth/logout")) {
        localStorage.removeItem("token");
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getCurrentUser: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  changePassword: (data) => api.post("/auth/change-password", data),
  getStats: () => api.get("/auth/stats"),
};

export const gamesAPI = {
  getAll: () => api.get("/games"),
  getGame: (gameName) => api.get(`/games/${gameName}`),

  playFlip: (data) => api.post("/games/flip/play", data),
  playDice: (data) => api.post("/games/dice/play", data),
  playLimbo: (data) => api.post("/games/limbo/play", data),

  startMines: (data) => api.post("/games/mines/start", data),
  revealMinesCell: (data) => api.post("/games/mines/reveal", data),
  cashoutMines: (data) => api.post("/games/mines/cashout", data),

  playRoulette: (data) => api.post("/games/roulette/play", data),

  startBlackjack: (data) => api.post("/games/blackjack/start", data),
  blackjackAction: (data) => api.post("/games/blackjack/action", data),

  kenoLadder: (params) => api.get("/games/keno/ladder", { params }),
  playKeno: (data) => api.post("/games/keno/play", data),
  playPlinko: (data) => api.post("/games/plinko/play", data),

  towerStart: (data) => api.post("/games/tower/start", data),
  towerPick: (data) => api.post("/games/tower/pick", data),
  towerCashout: (data) => api.post("/games/tower/cashout", data),

  processAutobet: (data) => api.post("/games/autobet", data),

  getUserRounds: (params) => api.get("/games/rounds/user", { params }),
  getRound: (roundId) => api.get(`/games/rounds/${roundId}`),

  playRussianRoulette: (data) => api.post("/games/russian-roulette/play", data),
  russianRouletteStart: (data) => api.post("/games/russian-roulette/start", data),
  russianRouletteBetShot: (data) => api.post("/games/russian-roulette/bet-shot", data),
  russianRouletteResolveShot: (data) => api.post("/games/russian-roulette/resolve-shot", data),

  playWheel: (data) => api.post("/games/wheel/play", data),
  getWheelLayout: (payload) => api.post("/games/wheel/layout", payload),

  snakesLayout: (data) => api.post("/games/snakes/layout", data),
  snakesStart: (data) => api.post("/games/snakes/start", data),
  snakesRoll: (data) => api.post("/games/snakes/roll", data),
  snakesCashout: (data) => api.post("/games/snakes/cashout", data),

  rpsStart: (data) => api.post("/games/rps/start", data),
  rpsChoose: (data) => api.post("/games/rps/choose", data),
  rpsCashout: (data) => api.post("/games/rps/cashout", data),
};

export const stocksAPI = {
  getPrice: (symbol) => api.get(`/stocks/price/${symbol}`),
  getChartData: (symbol, timeframe) => api.get(`/stocks/chart/${symbol}`, { params: { timeframe } }),
  searchStocks: (query) => api.get("/stocks/search", { params: { q: query } }),
  getPopular: () => api.get("/stocks/popular"),
  getMarketStatus: () => api.get("/stocks/market/status"),
  placeBet: (data) => api.post("/stocks/bet", data),
  getUserBets: (params) => api.get("/stocks/bets/user", { params }),
  getActiveBetUpdates: () => api.get("/stocks/bets/updates"),
  getStats: (params) => api.get("/stocks/stats", { params }),
  getAllActiveBets: (params) => api.get("/stocks/bets/active", { params }),
  validateSymbol: (symbol) => api.get(`/stocks/validate/${symbol}`),
};

// ✅ Custom Bets v2 API
export const customBetsAPI = {
  list: (params) => api.get("/custom-bets", { params }),
  get: (betId) => api.get(`/custom-bets/${betId}`),

  // can be JSON or FormData
  create: (data) => api.post("/custom-bets", data),

  buy: (betId, data) => api.post(`/custom-bets/${betId}/buy`, data),
  updatePercents: (betId, data) => api.post(`/custom-bets/${betId}/percents`, data),

  // per-option graph
  graph: (betId, params) => api.get(`/custom-bets/${betId}/graph`, { params }),

  // ✅ NEW: market-wide graph (dominant option % over time)
  graphMarket: (betId, params) => api.get(`/custom-bets/${betId}/graph-market`, { params }),

  // comments
  listComments: (betId, params) => api.get(`/custom-bets/${betId}/comments`, { params }),
  addComment: (betId, data) => api.post(`/custom-bets/${betId}/comments`, data),
  editComment: (commentId, data) => api.put(`/custom-bets/comments/${commentId}`, data),
  deleteComment: (commentId) => api.delete(`/custom-bets/comments/${commentId}`),

  // ✅ NEW: Like + Reply
  toggleCommentLike: (betId, commentId) =>
    api.post(`/custom-bets/${betId}/comments/${commentId}/like`),

  replyToComment: (betId, commentId, data) =>
    api.post(`/custom-bets/${betId}/comments/${commentId}/reply`, data),

  // admin
  adminClose: (betId) => api.post(`/custom-bets/${betId}/close`),
  adminReopen: (betId) => api.post(`/custom-bets/${betId}/reopen`),
  adminResolve: (betId, data) => api.post(`/custom-bets/${betId}/resolve`, data),
  adminRemove: (betId) => api.delete(`/custom-bets/${betId}`),

  // owner/admin extend end time
  adminExtendEnd: (betId, data) => api.post(`/custom-bets/${betId}/extend-end`, data),
};

export const dashboardAPI = {
  getUserDashboard: (params) => api.get("/dashboard", { params }),
  getStatsByTimeframe: (timeframe) => api.get(`/dashboard/stats/${timeframe}`),
  getLeaderboard: (params) => api.get("/dashboard/leaderboard", { params }),
  getRecentActivity: (params) => api.get("/dashboard/activity/recent", { params }),
  getBiggestWins: (params) => api.get("/dashboard/wins/biggest", { params }),
  getActivityTimeline: (params) => api.get("/dashboard/activity/timeline", { params }),
  getProfitChart: (params) => api.get("/dashboard/profit/chart", { params }),
  exportData: (params) => api.get("/dashboard/export", { params }),
};

export const adminAPI = {
  getAllUsers: (params) => api.get("/admin/users", { params }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  adjustBalance: (userId, data) => api.post(`/admin/users/${userId}/adjust-balance`, data),
  changeUserRole: (userId, data) => api.post(`/admin/users/${userId}/role`, data),
  setUserStatus: (userId, data) => api.post(`/admin/users/${userId}/status`, data),

  timeoutUser: (userId, data) => api.post(`/admin/users/${userId}/timeout`, data),
  clearTimeout: (userId) => api.post(`/admin/users/${userId}/timeout/clear`),

  banUser: (userId, data) => api.post(`/admin/users/${userId}/ban`, data),
  clearBan: (userId) => api.post(`/admin/users/${userId}/ban/clear`),

  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  setBypassDisabled: (userId, data) => api.post(`/admin/users/${userId}/bypass-disabled`, data),

  setAdminPermissions: (userId, data) => api.post(`/admin/users/${userId}/admin-permissions`, data),

  setAdminAccessPermissions: (userId, data) => api.post(`/admin/users/${userId}/admin-access`, data),

  setAdminCustomBetsPermissions: (userId, data) =>
    api.post(`/admin/users/${userId}/custom-bets-permissions`, data),

  getSettings: () => api.get("/admin/settings"),
  updateSetting: (data) => api.post("/admin/settings", data),

  getGames: () => api.get("/admin/games"),
  setGameStatus: (gameId, data) => api.post(`/admin/games/${gameId}/status`, data),

  getPages: () => api.get("/admin/pages"),
  setPageStatus: (pageKey, data) => api.post(`/admin/pages/${pageKey}/status`, data),
};

export default api;