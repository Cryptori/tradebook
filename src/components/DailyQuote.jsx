import { useMemo } from "react";

const QUOTES = [
  { text: "The goal of a successful trader is to make the best trades. Money is secondary.", author: "Alexander Elder" },
  { text: "The stock market is filled with individuals who know the price of everything, but the value of nothing.", author: "Philip Fisher" },
  { text: "In trading, the goal is to be consistently profitable over time, not to win every trade.", author: "Unknown" },
  { text: "Risk comes from not knowing what you're doing.", author: "Warren Buffett" },
  { text: "The most important thing in making money is not letting your losses get out of hand.", author: "Martin Schwartz" },
  { text: "It's not whether you're right or wrong that's important, but how much money you make when you're right and how much you lose when you're wrong.", author: "George Soros" },
  { text: "The elements of good trading are: cutting losses, cutting losses, and cutting losses.", author: "Ed Seykota" },
  { text: "I'm always thinking about losing money as opposed to making money.", author: "Paul Tudor Jones" },
  { text: "The market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { text: "Trading is a marathon, not a sprint. Focus on consistent performance, not home runs.", author: "Unknown" },
  { text: "The key to trading success is emotional discipline. If intelligence were the key, there would be a lot more people making money trading.", author: "Victor Sperandeo" },
  { text: "Win or lose, everybody gets what they want out of the market.", author: "Ed Seykota" },
  { text: "Disiplin adalah jembatan antara tujuan dan pencapaian.", author: "Jim Rohn" },
  { text: "Satu trade tidak menentukan karier kamu. Ribuan trade yang konsisten akan.", author: "Unknown" },
  { text: "Jangan trading berdasarkan harapan. Trading berdasarkan data dan rencana.", author: "Unknown" },
  { text: "Protect your capital first. Profits will follow.", author: "Unknown" },
  { text: "A peak performance trader is totally focused on the market and not on the money.", author: "Van K. Tharp" },
  { text: "The best traders have no ego. You have to swallow your pride and get out of the losses.", author: "Tom Baldwin" },
  { text: "Semua trader yang sukses punya satu kesamaan: mereka belajar dari setiap trade.", author: "Unknown" },
  { text: "Pasar tidak peduli seberapa pintar kamu. Pasar hanya peduli pada apa yang kamu lakukan.", author: "Unknown" },
  { text: "Setiap loss adalah biaya pendidikan trading.", author: "Unknown" },
  { text: "Consistency over intensity. Small wins compound into big results.", author: "Unknown" },
  { text: "Your trading journal is your best mentor.", author: "Unknown" },
  { text: "Jangan kejar pasar. Tunggu setup yang tepat, lalu eksekusi dengan percaya diri.", author: "Unknown" },
  { text: "The trend is your friend until the bend at the end.", author: "Ed Seykota" },
  { text: "Patience, discipline, and courage — the three pillars of successful trading.", author: "Unknown" },
  { text: "Never risk more than you can afford to lose.", author: "Unknown" },
  { text: "Plan your trade. Trade your plan.", author: "Unknown" },
  { text: "Losses are tuition. The question is: what are you learning?", author: "Unknown" },
  { text: "The market gives. The market takes. Your job is to manage both gracefully.", author: "Unknown" },
];

export default function DailyQuote({ theme: t }) {
  // Get deterministic quote for today
  const quote = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < today.length; i++) hash = today.charCodeAt(i) + ((hash << 5) - hash);
    return QUOTES[Math.abs(hash) % QUOTES.length];
  }, []);

  return (
    <div style={{
      background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgCard2})`,
      border: `1px solid ${t.border}`,
      borderRadius: 12, padding: "16px 20px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Decorative quote mark */}
      <div style={{ position: "absolute", top: -10, left: 12, fontSize: 80, color: t.accent, opacity: 0.06, fontFamily: "Georgia, serif", lineHeight: 1, userSelect: "none" }}>"</div>

      <div style={{ fontSize: 9, color: t.accent, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 10 }}>
        Quote of the Day
      </div>
      <div style={{ fontSize: 13, color: t.text, lineHeight: 1.8, fontStyle: "italic", marginBottom: 10, position: "relative", zIndex: 1 }}>
        "{quote.text}"
      </div>
      <div style={{ fontSize: 11, color: t.textDim, textAlign: "right" }}>
        — {quote.author}
      </div>
    </div>
  );
}