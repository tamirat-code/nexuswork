import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  GraduationCap,
  ArrowRight,
  BadgeCheck,
  Sparkles,
} from "lucide-react";

const students = [
  {
    id: 1,
    name: "Abebe Kebede",
    department: "Computer Science",
    university: "University Student",
    location: "Ethiopia",
    skills: ["React", "Node.js", "MongoDB"],
    initials: "AK",
    verified: true,
    availability: "Available",
  },
  {
    id: 2,
    name: "Sara Tesfaye",
    department: "Software Engineering",
    university: "University Student",
    location: "Ethiopia",
    skills: ["UI/UX", "Figma", "React"],
    initials: "ST",
    verified: true,
    availability: "Available",
  },
  {
    id: 3,
    name: "Daniel Mekonnen",
    department: "Information Technology",
    university: "University Student",
    location: "Ethiopia",
    skills: ["Networking", "Linux", "Security"],
    initials: "DM",
    verified: false,
    availability: "Busy",
  },
  {
    id: 4,
    name: "Hanna Alemu",
    department: "Computer Science",
    university: "University Student",
    location: "Ethiopia",
    skills: ["Python", "AI", "Machine Learning"],
    initials: "HA",
    verified: true,
    availability: "Available",
  },
  {
    id: 5,
    name: "Yonas Girma",
    department: "Software Engineering",
    university: "University Student",
    location: "Ethiopia",
    skills: ["Java", "Spring Boot", "SQL"],
    initials: "YG",
    verified: true,
    availability: "Available",
  },
  {
    id: 6,
    name: "Meron Bekele",
    department: "Information Systems",
    university: "University Student",
    location: "Ethiopia",
    skills: ["Database", "SQL", "Data Analysis"],
    initials: "MB",
    verified: false,
    availability: "Available",
  },
];

export default function StudentsPage() {
  return (
    <div className="min-h-screen bg-ink text-slate">
      {/* Hero */}
      <section className="border-b border-ink-300">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink-300 bg-ink-50 px-3 py-1.5 text-xs font-medium text-brass">
              <Sparkles className="h-3.5 w-3.5" />
              Discover student talent
            </div>

            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Find skilled students
              <span className="text-brass"> ready to work.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              Discover talented university students, explore their skills,
              and find the right person for your next project.
            </p>
          </div>

          {/* Search */}
          <div className="mt-10 max-w-3xl">
            <div className="flex items-center rounded-2xl border border-ink-300 bg-ink-50 px-4 py-3 shadow-card">
              <Search className="h-5 w-5 shrink-0 text-slate-500" />

              <input
                type="text"
                placeholder="Search students by skill, department, or name..."
                className="ml-3 w-full bg-transparent text-sm text-slate outline-none placeholder:text-slate-500"
              />

              <button
                type="button"
                className="hidden rounded-xl bg-brass px-5 py-2 text-sm font-semibold text-ink transition hover:opacity-90 sm:block"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">
              Student marketplace
            </p>

            <h2 className="mt-2 font-display text-2xl font-semibold">
              Explore student talent
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Browse verified students and their professional skills.
            </p>
          </div>

          <select
            className="rounded-xl border border-ink-300 bg-ink-50 px-4 py-2.5 text-sm text-slate outline-none"
            defaultValue="all"
          >
            <option value="all">All departments</option>
            <option value="computer-science">Computer Science</option>
            <option value="software-engineering">
              Software Engineering
            </option>
            <option value="information-technology">
              Information Technology
            </option>
            <option value="information-systems">
              Information Systems
            </option>
          </select>
        </div>

        {/* Student cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <article
              key={student.id}
              className="group rounded-2xl border border-ink-300 bg-ink-50 p-5 transition duration-300 hover:-translate-y-1 hover:border-brass/40 hover:shadow-card"
            >
              {/* Profile header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brass/15 text-sm font-bold text-brass">
                    {student.initials}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-slate">
                        {student.name}
                      </h3>

                      {student.verified && (
                        <BadgeCheck className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {student.department}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    student.availability === "Available"
                      ? "bg-emerald-400/10 text-emerald-400"
                      : "bg-slate-400/10 text-slate-400"
                  }`}
                >
                  {student.availability}
                </span>
              </div>

              {/* University */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <GraduationCap className="h-4 w-4 text-brass" />
                  {student.university}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <MapPin className="h-4 w-4 text-brass" />
                  {student.location}
                </div>
              </div>

              {/* Skills */}
              <div className="mt-5 flex flex-wrap gap-2">
                {student.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-ink-300 bg-ink px-2.5 py-1 text-[11px] text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Profile button */}
              <Link
                to={`/students/${student.id}`}
                className="mt-6 flex items-center justify-between border-t border-ink-300 pt-4 text-sm font-semibold text-slate transition-colors group-hover:text-brass"
              >
                View profile

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}