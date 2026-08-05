// Generic table shell — extend with sorting/pagination as admin/analytics screens need it.
export default function DataTable({ columns, rows }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b text-left text-gray-500">
          {columns.map((c) => (
            <th key={c.key} className="py-2 pr-4">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b">
            {columns.map((c) => (
              <td key={c.key} className="py-2 pr-4">
                {row[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
