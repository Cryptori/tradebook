// Proxy ke Forex Factory RSS feed — gratis, no API key needed
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ForexFactory JSON feed — public, no auth needed
    const url = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) throw new Error("Feed unavailable");

    const data = await response.json();

    // Normalize data
    const events = data.map(e => ({
      id:       e.title + "_" + e.date + "_" + e.time,
      title:    e.title,
      country:  e.country,
      currency: e.country, // FF uses country code as currency
      date:     e.date,
      time:     e.time,
      impact:   e.impact,  // "High", "Medium", "Low", "Holiday"
      forecast: e.forecast || "",
      previous: e.previous || "",
      actual:   e.actual   || "",
    }));

    res.setHeader("Cache-Control", "s-maxage=1800"); // cache 30 menit
    res.status(200).json({ events, source: "forexfactory", fetchedAt: new Date().toISOString() });
  } catch (err) {
    // Fallback — return empty, client akan pakai data manual
    res.status(200).json({ events: [], error: err.message, source: "fallback" });
  }
}