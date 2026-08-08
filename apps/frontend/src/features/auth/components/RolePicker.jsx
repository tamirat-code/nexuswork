const options = [
  { value: "student", label: "I'm a student", hint: "Find real projects to work on" },
  { value: "client", label: "I'm hiring", hint: "Post work for verified students" },
  { value: "university_staff", label: "University staff", hint: "Verify students at your university" },
];

export default function RolePicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="I am a..." className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`text-left rounded-card border p-4 transition-colors duration-150
              ${selected ? "border-ink bg-ink-50" : "border-ink-100 hover:border-ink-300"}`}
          >
            <p className="text-sm font-semibold text-ink">{opt.label}</p>
            <p className="text-xs text-slate mt-0.5">{opt.hint}</p>
          </button>
        );
      })}
    </div>
  );
}