import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-md border border-ink-300 bg-ink-100 px-3 py-2 text-xs shadow-card">
      <p className="font-semibold text-slate">{label}</p>
      <p className="mt-0.5 text-brass">{valueFormatter ? valueFormatter(value) : value}</p>
    </div>
  );
}


export default function BarChart({ data, valueFormatter, height = 220 }) {
  if (!data?.length) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-slate-300">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: "#9CA3AF", fontSize: 11 }}
          axisLine={{ stroke: "#2a2f3a" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#9CA3AF", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={(v) => (valueFormatter ? valueFormatter(v) : v)}
        />
        <Tooltip
          cursor={{ fill: "rgba(0, 200, 180, 0.08)" }}
          content={<ChartTooltip valueFormatter={valueFormatter} />}
        />
        <Bar dataKey="total" fill="#00c8b4" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}