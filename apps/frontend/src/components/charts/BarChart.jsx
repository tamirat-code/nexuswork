// TODO: wire a real charting lib (recharts) once the analytics module has real data.
export default function BarChart({ data }) {
  return <div className="text-sm text-gray-500">Chart placeholder ({data?.length || 0} points)</div>;
}
