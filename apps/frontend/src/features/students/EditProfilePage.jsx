import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

export default function EditProfilePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-ink px-6 py-10 text-slate">
      <div className="mx-auto max-w-4xl">

        {/* Back */}
        <Link
          to="/profile"
          className="text-sm text-slate-300 transition hover:text-brass"
        >
          ← Back to profile
        </Link>

        {/* Header */}
        <div className="mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">
            Profile settings
          </p>

          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            Edit your profile
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            Keep your professional information up to date so clients and
            universities can understand your skills and experience.
          </p>
        </div>

        {/* Form */}
        <div className="mt-8 rounded-card border border-ink-300 bg-ink-50 p-6 shadow-card sm:p-8">

          {/* Profile image */}
          <div className="border-b border-ink-300 pb-7">
            <p className="text-sm font-semibold text-slate">
              Profile photo
            </p>

            <div className="mt-4 flex items-center gap-5">

              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink-300 bg-[#0b5960] text-xl font-bold text-brass">
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "U"}
              </div>

              <div>
                <button
                  type="button"
                  className="rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-brass hover:text-brass"
                >
                  Change photo
                </button>

                <p className="mt-2 text-xs text-slate-400">
                  JPG, PNG or WEBP. Maximum 5MB.
                </p>
              </div>

            </div>
          </div>

          {/* Basic information */}
          <div className="mt-7">

            <h2 className="text-lg font-semibold">
              Basic information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <div>
                <label className="text-sm text-slate-300">
                  Full name
                </label>

                <input
                  type="text"
                  defaultValue={user?.name || ""}
                  className="mt-2 w-full rounded-lg border border-ink-300 bg-ink px-4 py-3 text-sm text-slate outline-none transition focus:border-brass"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">
                  Email
                </label>

                <input
                  type="email"
                  defaultValue={user?.email || ""}
                  disabled
                  className="mt-2 w-full cursor-not-allowed rounded-lg border border-ink-300 bg-ink-100 px-4 py-3 text-sm text-slate-400"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Your university email cannot be changed here.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm text-slate-300">
                  Professional headline
                </label>

                <input
                  type="text"
                  className="mt-2 w-full rounded-lg border border-ink-300 bg-ink px-4 py-3 text-sm text-slate outline-none transition focus:border-brass"
                  placeholder="e.g. Computer Science Student & Full-Stack Developer"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm text-slate-300">
                  About you
                </label>

                <textarea
                  rows="6"
                  className="mt-2 w-full resize-none rounded-lg border border-ink-300 bg-ink px-4 py-3 text-sm leading-relaxed text-slate outline-none transition focus:border-brass"
                  placeholder="Tell clients about yourself, your experience, and what you can help them with..."
                />
              </div>

            </div>
          </div>

          {/* Education */}
          <div className="mt-8 border-t border-ink-300 pt-7">

            <h2 className="text-lg font-semibold">
              Education
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <div>
                <label className="text-sm text-slate-300">
                  University
                </label>

                <input
                  type="text"
                  defaultValue="University of Gondar"
                  className="mt-2 w-full rounded-lg border border-ink-300 bg-ink px-4 py-3 text-sm text-slate outline-none focus:border-brass"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">
                  Department
                </label>

                <input
                  type="text"
                  defaultValue="Computer Science"
                  className="mt-2 w-full rounded-lg border border-ink-300 bg-ink px-4 py-3 text-sm text-slate outline-none focus:border-brass"
                />
              </div>

            </div>
          </div>

          {/* Skills */}
          <div className="mt-8 border-t border-ink-300 pt-7">

            <h2 className="text-lg font-semibold">
              Skills
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Add the skills you want clients to discover you for.
            </p>

            <input
              type="text"
              className="mt-5 w-full rounded-lg border border-ink-300 bg-ink px-4 py-3 text-sm text-slate outline-none focus:border-brass"
              placeholder="React, Node.js, MongoDB, UI/UX..."
            />

          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-ink-300 pt-6 sm:flex-row sm:justify-end">

            <Link
              to="/profile"
              className="rounded-lg border border-ink-300 px-5 py-3 text-center text-sm font-medium text-slate-300 transition hover:border-slate-400 hover:text-slate"
            >
              Cancel
            </Link>

            <button
              type="button"
              className="rounded-lg bg-brass px-5 py-3 text-sm font-semibold text-ink transition hover:opacity-90"
            >
              Save changes
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}