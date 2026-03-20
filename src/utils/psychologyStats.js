// ── Trading Psychology Statistics ─────────────────────────────────

export const EMOTIONS_POSITIVE = ["Calm", "Confident", "🔥 Focused", "💪 Confident", "😌 Calm"];
export const EMOTIONS_NEGATIVE = ["Fear", "Greed", "Revenge", "Frustrated", "Anxious", "😤 Frustrated", "😰 Anxious"];
export const EMOTIONS_NEUTRAL  = ["Neutral", "Mixed", "😴 Tired"];

export function getEmotionCategory(emotion) {
  if (!emotion) return "neutral";
  if (EMOTIONS_POSITIVE.some(e => emotion.includes(e.replace(/[^a-zA-Z]/g, "")))) return "positive";
  if (EMOTIONS_NEGATIVE.some(e => emotion.includes(e.replace(/[^a-zA-Z]/g, "")))) return "negative";
  return "neutral";
}

/**
 * Win rate per emotion
 */
export function calcEmotionCorrelation(trades) {
  if (!trades || trades.length === 0) return [];
  const byEmotion = {};
  trades.forEach(tr => {
    const emo = tr.emotion || "Unknown";
    if (!byEmotion[emo]) byEmotion[emo] = { wins: 0, losses: 0, pnl: 0, rrs: [] };
    if (tr.pnl >= 0) byEmotion[emo].wins++;
    else byEmotion[emo].losses++;
    byEmotion[emo].pnl += tr.pnl || 0;
    if (tr.rr) byEmotion[emo].rrs.push(parseFloat(tr.rr));
  });

  return Object.entries(byEmotion).map(([emotion, data]) => {
    const total  = data.wins + data.losses;
    const winRate = total > 0 ? (data.wins / total) * 100 : 0;
    const avgRR   = data.rrs.length > 0 ? data.rrs.reduce((s, r) => s + r, 0) / data.rrs.length : 0;
    const category = getEmotionCategory(emotion);
    return { emotion, total, wins: data.wins, losses: data.losses, winRate, pnl: data.pnl, avgRR, category };
  }).sort((a, b) => b.total - a.total);
}

/**
 * Psychology score harian (0-100)
 * Berdasarkan: emosi positif, win rate, tidak overtrade, R:R bagus
 */
export function calcDailyPsychScore(trades, journalEntry) {
  if (!trades || trades.length === 0) return null;

  let score = 50; // base
  const scores = { emotion: 0, performance: 0, discipline: 0, consistency: 0 };

  // 1. Emotion score (25 pts)
  const emotions = trades.map(tr => tr.emotion || "");
  const positiveCount = emotions.filter(e => getEmotionCategory(e) === "positive").length;
  const negativeCount = emotions.filter(e => getEmotionCategory(e) === "negative").length;
  scores.emotion = positiveCount > negativeCount ? 25 : negativeCount > positiveCount ? 5 : 15;

  // 2. Performance (25 pts)
  const wins = trades.filter(tr => tr.pnl >= 0).length;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
  scores.performance = Math.min(25, Math.round(winRate / 4));

  // 3. Discipline — tidak overtrade (25 pts)
  const tradeCount = trades.length;
  scores.discipline = tradeCount <= 3 ? 25 : tradeCount <= 5 ? 18 : tradeCount <= 8 ? 10 : 5;

  // 4. Consistency — avg R:R (25 pts)
  const rrs = trades.map(tr => parseFloat(tr.rr) || 0).filter(r => r > 0);
  const avgRR = rrs.length > 0 ? rrs.reduce((s, r) => s + r, 0) / rrs.length : 0;
  scores.consistency = avgRR >= 2 ? 25 : avgRR >= 1.5 ? 20 : avgRR >= 1 ? 14 : avgRR > 0 ? 8 : 5;

  // Bonus dari journal entry
  if (journalEntry?.pre_analysis) score += 5;
  if (journalEntry?.post_review)  score += 5;

  score = Math.min(100, scores.emotion + scores.performance + scores.discipline + scores.consistency);
  return { score, scores };
}

/**
 * Detect overtrade / revenge trade patterns
 */
export function detectPatterns(trades, journalEntries) {
  const warnings = [];
  if (!trades || trades.length === 0) return warnings;

  // Group by date
  const byDate = {};
  trades.forEach(tr => {
    if (!tr.date) return;
    if (!byDate[tr.date]) byDate[tr.date] = [];
    byDate[tr.date].push(tr);
  });

  Object.entries(byDate).forEach(([date, dayTrades]) => {
    // Overtrade: > 5 trades in a day
    if (dayTrades.length > 5) {
      warnings.push({ type: "overtrade", date, message: `${dayTrades.length} trades dalam 1 hari`, severity: "high" });
    }

    // Revenge trade pattern: loss followed by multiple quick trades
    const sorted = [...dayTrades].sort((a, b) => a.entry - b.entry);
    let consecutiveLosses = 0;
    sorted.forEach(tr => {
      if (tr.pnl < 0) {
        consecutiveLosses++;
        if (consecutiveLosses >= 3) {
          warnings.push({ type: "revenge", date, message: `${consecutiveLosses} loss berturut-turut pada ${date}`, severity: "high" });
        }
      } else { consecutiveLosses = 0; }
    });

    // Negative emotion with big loss
    const bigLosses = dayTrades.filter(tr => tr.pnl < -100);
    const negEmo = dayTrades.filter(tr => getEmotionCategory(tr.emotion) === "negative");
    if (bigLosses.length > 0 && negEmo.length > 0) {
      warnings.push({ type: "emotional", date, message: `Trading dengan emosi negatif saat loss besar pada ${date}`, severity: "medium" });
    }
  });

  return warnings.slice(-10); // last 10
}

/**
 * Mood streak — consecutive days with positive emotion trades
 */
export function calcMoodStreak(trades) {
  if (!trades || trades.length === 0) return 0;

  const byDate = {};
  trades.forEach(tr => {
    if (!tr.date) return;
    if (!byDate[tr.date]) byDate[tr.date] = [];
    byDate[tr.date].push(tr);
  });

  const dates = Object.keys(byDate).sort().reverse();
  let streak = 0;
  for (const date of dates) {
    const dayTrades = byDate[date];
    const positive  = dayTrades.filter(tr => getEmotionCategory(tr.emotion) === "positive").length;
    const total     = dayTrades.length;
    if (positive / total >= 0.5) streak++;
    else break;
  }
  return streak;
}

/**
 * Mood calendar — daily emotion summary for last 30 days
 */
export function calcMoodCalendar(trades, journalEntries) {
  const days = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const date = d.toISOString().slice(0, 10);

    const dayTrades  = (trades || []).filter(tr => tr.date === date);
    const journal    = (journalEntries || []).find(e => e.date === date);
    const mood       = journal?.mood || (dayTrades.length > 0 ? dayTrades[0].emotion : null);

    const positive = dayTrades.filter(tr => getEmotionCategory(tr.emotion) === "positive").length;
    const negative = dayTrades.filter(tr => getEmotionCategory(tr.emotion) === "negative").length;
    const pnl      = dayTrades.reduce((s, tr) => s + (tr.pnl || 0), 0);

    const category = dayTrades.length === 0 ? "empty"
      : positive > negative ? "positive"
      : negative > positive ? "negative"
      : "neutral";

    days.push({ date, category, mood, pnl, tradeCount: dayTrades.length, hasJournal: !!journal });
  }
  return days;
}

/**
 * Generate psychology tips based on data
 */
export function generatePsychTips(emotionCorrelation, patterns, moodStreak) {
  const tips = [];

  // Best emotion tip
  const best = emotionCorrelation.filter(e => e.total >= 3).sort((a, b) => b.winRate - a.winRate)[0];
  if (best) tips.push({ icon: "🎯", text: `Trading terbaik kamu saat emosi "${best.emotion}" — win rate ${best.winRate.toFixed(0)}%`, type: "insight" });

  // Worst emotion tip
  const worst = emotionCorrelation.filter(e => e.total >= 3 && e.category === "negative").sort((a, b) => a.winRate - b.winRate)[0];
  if (worst) tips.push({ icon: "⚠️", text: `Hindari trading saat "${worst.emotion}" — win rate hanya ${worst.winRate.toFixed(0)}%`, type: "warning" });

  // Overtrade pattern
  const overtrades = patterns.filter(p => p.type === "overtrade").length;
  if (overtrades > 0) tips.push({ icon: "🛑", text: `Terdeteksi ${overtrades}x overtrade — batasi maksimal 3-5 trade per hari`, type: "warning" });

  // Revenge trade
  const revenge = patterns.filter(p => p.type === "revenge").length;
  if (revenge > 0) tips.push({ icon: "😤", text: `Terdeteksi ${revenge}x pola revenge trade — ambil jeda setelah 2 loss berturut-turut`, type: "danger" });

  // Mood streak
  if (moodStreak >= 3) tips.push({ icon: "🔥", text: `${moodStreak} hari berturut-turut dengan emosi positif — pertahankan!`, type: "success" });

  // General tips if no data
  if (tips.length === 0) tips.push({ icon: "📊", text: "Log lebih banyak trade dengan data emosi untuk mendapat insight psikologi", type: "info" });

  return tips;
}