"use client";
import { useState, useEffect } from "react";

function CardLoader() {
  return (
    <div className="card-loader">
      <div className="uib-container">
        <div className="uib-dot" /><div className="uib-dot" />
        <div className="uib-dot" /><div className="uib-dot" />
      </div>
    </div>
  );
}

const COLORS = [
  "#B85530", "#5C6B2E", "#D4724A", "#8C7B68",
  "#C4A882", "#7A9E4E", "#E8A87C", "#4A6741",
  "#9B7451", "#6B8E3A",
];

const CATEGORY_COLORS = {
  "❤️":              "#E05C6B",
  "מאפים":           "#D4A043",
  "עוגות וקינוחים":  "#C978C0",
  "מרקים":           "#E8862A",
  "סלטים":           "#6DB33F",
  "בשרים":           "#A63228",
  "תוספות":          "#4A9E8A",
  "פסטה":            "#D4B840",
  "ללא קטגוריה":     "#B0A090",
};

function WeeklyChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 44, GAP = 4, H = 80, TOP = 18, LABEL_H = 28;
  const total = data.length;
  const width = total * (W + GAP) - GAP;

  return (
    <div style={{ overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch" }}>
      <svg width={width} height={TOP + H + LABEL_H} viewBox={`0 0 ${width} ${TOP + H + LABEL_H}`} style={{ display: "block", margin: "0 auto", minWidth: width }}>
        {data.map((d, i) => {
          const barH = Math.max(2, (d.count / max) * H);
          const x = i * (W + GAP);
          const y = TOP + H - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={W} height={barH} rx="5"
                fill={d.count > 0 ? "#B85530" : "#EDE5D4"} />
              {d.count > 0 && (
                <text x={x + W / 2} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#B85530">{d.count}</text>
              )}
              <text x={x + W / 2} y={TOP + H + 14} textAnchor="middle" fontSize="9" fill="#8C7B68">{d.label}</text>
              <text x={x + W / 2} y={TOP + H + 25} textAnchor="middle" fontSize="9" fill="#B0A090">{d.year}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PieChart({ data }) {
  const cx = 90, cy = 90, r = 75;
  let cumAngle = -Math.PI / 2;
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;

  const slices = data.map((d, i) => {
    const angle = (d.count / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    const color = CATEGORY_COLORS[d.category] ?? COLORS[i % COLORS.length];
    return { ...d, path, color };
  });

  return (
    <div className="pie-inner">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="#FAF6EE" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="chart-legend">
        {slices.map((s, i) => (
          <div key={i} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }} />
            <span className="legend-label">{s.category}</span>
            <span className="legend-count">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ data }) {
  const cx = 90, cy = 90, r = 65, inner = 38;
  let cumAngle = -Math.PI / 2;
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;

  const slices = data.map((d) => {
    const angle = (d.count / total) * 2 * Math.PI;
    const x1o = cx + r * Math.cos(cumAngle), y1o = cy + r * Math.sin(cumAngle);
    const x1i = cx + inner * Math.cos(cumAngle), y1i = cy + inner * Math.sin(cumAngle);
    cumAngle += angle;
    const x2o = cx + r * Math.cos(cumAngle), y2o = cy + r * Math.sin(cumAngle);
    const x2i = cx + inner * Math.cos(cumAngle), y2i = cy + inner * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    const path = `M ${x1i} ${y1i} L ${x1o} ${y1o} A ${r} ${r} 0 ${large} 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${inner} ${inner} 0 ${large} 0 ${x1i} ${y1i} Z`;
    return { ...d, path, color: d.color };
  });

  return (
    <div className="pie-inner">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {slices.map((s) => (
          <path key={s.label} d={s.path} fill={s.color} stroke="#FAF6EE" strokeWidth="1.5" />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1E1208">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#8C7B68">מתכונים</text>
      </svg>
      <div className="chart-legend">
        {slices.map((s, i) => (
          <div key={i} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }} />
            <span className="legend-label">{s.label}</span>
            <span className="legend-count">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.count));
  return (
    <div className="bar-inner">
      {data.map((d, i) => (
        <div key={i} className="bar-row">
          <span className="bar-label">{d.source}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(d.count / max) * 100}%`, background: COLORS[i % COLORS.length] }}
            />
          </div>
          <span className="bar-count">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatsButton() {
  const [open, setOpen] = useState(false);
  const [categoryData, setCategoryData] = useState(null);
  const [sourceData, setSourceData] = useState(null);
  const [parseData, setParseData] = useState(null);
  const [ingredientData, setIngredientData] = useState(null);
  const [ingredientLoading, setIngredientLoading] = useState(false);
  const [weeklyData, setWeeklyData] = useState(null);

  useEffect(() => {
    if (!open || categoryData) return;
    fetch("/api/recipes")
      .then(r => r.json())
      .catch(() => [])
      .then(recipes => {
        // categories
        const cats = {};
        recipes.forEach(r => {
          const cat = r.category || "ללא קטגוריה";
          cats[cat] = (cats[cat] || 0) + 1;
        });
        setCategoryData(
          Object.entries(cats)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
        );

        // sources
        const srcs = {};
        recipes.forEach(r => {
          if (!r.source_url) return;
          try {
            const host = new URL(r.source_url).hostname.replace("www.", "");
            srcs[host] = (srcs[host] || 0) + 1;
          } catch {}
        });
        setSourceData(
          Object.entries(srcs)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        );

        // parse quality
        const statusMap = { schema: 0, ai: 0, fallback: 0 };
        recipes.forEach(r => {
          const s = r.parse_status || "fallback";
          if (s in statusMap) statusMap[s]++;
        });
        setParseData([
          { label: "Schema", count: statusMap.schema, color: "#5C6B2E" },
          { label: "AI", count: statusMap.ai, color: "#B85530" },
          { label: "Fallback", count: statusMap.fallback, color: "#C4A882" },
        ]);

        // uploads per week — last 12 weeks
        try {
          const MONTHS_HE = ["ינו","פבר","מרס","אפר","מאי","יוני","יולי","אוג","ספט","אוק","נוב","דצמ"];
          const now = Date.now();
          const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
          const weeks = Array.from({ length: 12 }, (_, i) => {
            const t = now - (11 - i) * MS_WEEK;
            const d = new Date(t);
            // snap to Monday
            const dayOfWeek = d.getDay(); // 0=Sun
            d.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
            d.setHours(0, 0, 0, 0);
            const startTs = d.getTime();
            return { startTs, endTs: startTs + MS_WEEK, count: 0, label: `${d.getDate()} ${MONTHS_HE[d.getMonth()]}`, year: d.getFullYear() };
          });
          recipes.forEach(r => {
            if (!r.created_at) return;
            const ts = new Date(r.created_at).getTime();
            if (isNaN(ts)) return;
            for (let i = weeks.length - 1; i >= 0; i--) {
              if (ts >= weeks[i].startTs && ts < weeks[i].endTs) { weeks[i].count++; break; }
            }
          });
          setWeeklyData(weeks.map(({ count, label, year }) => ({ count, label, year })));
        } catch (e) {
          setWeeklyData([]);
        }
      });

    // fetch AI-normalized ingredients separately (slower)
    setIngredientLoading(true);
    fetch("/api/stats")
      .then(r => r.json())
      .then(data => setIngredientData(data))
      .finally(() => setIngredientLoading(false));
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="stats-btn" title="סטטיסטיקות">
        📊
      </button>

      {open && (
        <div className="stats-overlay" onClick={() => setOpen(false)}>
          <div className="stats-modal" onClick={e => e.stopPropagation()}>
            <div className="stats-modal-header">
              <button className="stats-close" onClick={() => setOpen(false)}>✕</button>
              <p className="stats-title">סטטיסטיקות</p>
            </div>
            <div className="stats-cards">
              <div className="stats-card stats-card-wide">
                <p className="card-title">העלאות לפי שבוע — 12 שבועות אחרונים</p>
                {weeklyData ? <WeeklyChart data={weeklyData} /> : <CardLoader />}
              </div>
              <div className="stats-card">
                <p className="card-title">לפי קטגוריה</p>
                {categoryData ? <PieChart data={categoryData} /> : <CardLoader />}
              </div>
              <div className="stats-card">
                <p className="card-title">מרכיבים נפוצים</p>
                {ingredientLoading || !ingredientData
                  ? <CardLoader />
                  : <div className="ing-list">
                      {ingredientData.map((d, i) => (
                        <div key={i} className="ing-row">
                          <span className="ing-rank">{i + 1}</span>
                          <span className="ing-name">{d.name}</span>
                          <span className="ing-count">{d.count}</span>
                        </div>
                      ))}
                    </div>
                }
              </div>
              <div className="stats-card">
                <p className="card-title">מקורות</p>
                {sourceData ? <BarChart data={sourceData} /> : <CardLoader />}
              </div>
              <div className="stats-card">
                <p className="card-title">איכות פרסור</p>
                {parseData ? <DonutChart data={parseData} /> : <CardLoader />}
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .stats-btn { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0.3rem 0.4rem; opacity: 0.45; transition: opacity 0.2s; line-height: 1; }
        .stats-btn:hover { opacity: 1; }
        .stats-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .stats-modal { background: #FAF6EE; border-radius: 18px; padding: 2rem 1.5rem; width: min(96vw, 1000px); max-width: 100vw; position: relative; display: flex; flex-direction: column; align-items: center; gap: 1.25rem; max-height: 90vh; overflow-y: auto; overflow-x: hidden; box-sizing: border-box; }
        .stats-modal-header { display: flex; align-items: center; justify-content: center; position: relative; width: 100%; flex-shrink: 0; }
        .stats-close { position: absolute; left: 0; background: none; border: none; cursor: pointer; font-size: 1rem; color: #8C7B68; opacity: 0.6; padding: 0.25rem; }
        .stats-close:hover { opacity: 1; }
        .stats-title { font-family: 'Frank Ruhl Libre', serif; font-size: 1.25rem; font-weight: 700; color: #1E1208; }
        @media (max-width: 600px) {
          .stats-modal-header { position: sticky; top: 0; background: #FAF6EE; padding: 0.75rem 0; z-index: 10; border-bottom: 1px solid #EDE5D4; margin-bottom: 0.25rem; }
        }
        .stats-loading { color: #8C7B68; font-size: 0.9rem; }
        .card-loader { display: flex; align-items: center; justify-content: center; padding: 2rem 0; flex: 1; }
        .stats-card .uib-container { --uib-size: 44px; --uib-color: #B85530; --uib-speed: 1.4s; position: relative; display: flex; align-items: center; justify-content: center; width: calc(var(--uib-size) * 0.51); height: calc(var(--uib-size) * 0.51); }
        .stats-card .uib-dot { position: relative; display: flex; flex-shrink: 0; align-items: center; height: 100%; width: 25%; transform-origin: center top; }
        .stats-card .uib-dot::after { content: ''; display: block; width: 100%; height: 25%; border-radius: 50%; background-color: var(--uib-color); }
        .stats-card .uib-dot:first-child { animation: uib-swing var(--uib-speed) linear infinite; }
        .stats-card .uib-dot:last-child { animation: uib-swing2 var(--uib-speed) linear infinite; }
        @keyframes uib-swing { 0%{transform:rotate(0deg);animation-timing-function:ease-out} 25%{transform:rotate(-70deg);animation-timing-function:ease-in} 50%{transform:rotate(0deg);animation-timing-function:linear} }
        @keyframes uib-swing2 { 0%{transform:rotate(0deg);animation-timing-function:linear} 50%{transform:rotate(0deg);animation-timing-function:ease-out} 75%{transform:rotate(70deg);animation-timing-function:ease-in} }
        .stats-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; width: 100%; min-width: 0; }
        @media (max-width: 600px) {
          .stats-overlay { padding: 0; align-items: flex-end; padding-top: 120px; }
          .stats-modal { width: 100%; max-height: calc(100vh - 120px); border-radius: 20px 20px 0 0; padding: 1.5rem 1rem 2rem; }
          .stats-cards { grid-template-columns: 1fr; }
          .stats-card-wide { grid-column: 1; }
          .stats-title { font-size: 1.5rem; }
          .card-title { font-size: 0.95rem; }
        }
        .stats-card { background: white; border-radius: 14px; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06); min-width: 0; overflow: hidden; box-sizing: border-box; }
        .stats-card-wide { grid-column: 1 / -1; }
        .card-title { font-family: 'Frank Ruhl Libre', serif; font-size: 1.4rem; font-weight: 700; color: #1E1208; text-align: center; }
        .pie-inner { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
        .chart-legend { display: flex; flex-direction: column; gap: 0.3rem; width: 100%; }
        .legend-item { display: flex; align-items: center; gap: 0.45rem; font-size: 0.8rem; }
        .legend-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .legend-label { flex: 1; color: #1E1208; }
        .legend-count { color: #8C7B68; font-weight: 700; }
        .bar-inner { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; }
        .bar-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; }
        .bar-label { width: 90px; text-align: right; color: #1E1208; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
        .bar-track { flex: 1; background: #F0EAD8; border-radius: 100px; height: 10px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 100px; transition: width 0.4s ease; }
        .bar-count { width: 20px; text-align: left; color: #8C7B68; font-weight: 700; flex-shrink: 0; }
        .ing-list { display: flex; flex-direction: column; gap: 0.3rem; width: 100%; }
        .ing-row { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; padding: 0.25rem 0; border-bottom: 1px solid #F0EAD8; }
        .ing-row:last-child { border-bottom: none; }
        .ing-rank { width: 18px; color: #C4A882; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; text-align: center; }
        .ing-name { flex: 1; color: #1E1208; }
        .ing-count { color: #B85530; font-weight: 700; flex-shrink: 0; }
      ` }} />
    </>
  );
}
