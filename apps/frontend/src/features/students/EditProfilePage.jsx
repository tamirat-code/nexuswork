import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { useTranslation } from "react-i18next";

export default function EditProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-ink px-6 py-10 text-slate">
      <div className="mx-auto max-w-4xl">

        {/* Back */}
        <Link
          to="/profile"
          className="text-sm text-slate-300 transition hover:text-brass"
        >
          ← {t("profile.backToProfile")}
        </Link>

        {/* Header */}
        <div className="mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">
            {t("profile.settings")}
          </p>

          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            {t("profile.editTitle")}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            {t("profile.editDescription")}
          </p>
        </div>

        {/* Form */}
        <div className="mt-8 rounded-card border border-ink-300 bg-ink-50 p-6 shadow-card sm:p-8">

          {/* Profile image */}
          <div className="border-b border-ink-300 pb-7">
            <p className="text-sm font-semibold text-slate">
              {t("profile.photo")}
            </p>

            <div className="mt-4 flex items-center gap-5">

              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink-300 bg-brand-soft text-xl font-bold text-brass">
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
                  {t("profile.changePhoto")}
                </button>

                <p className="mt-2 text-xs text-slate-400">
                  {t("profile.photoHint")}
                </p>
              </div>

            </div>
          </div>

          {/* Basic information */}
          <div className="mt-7">

            <h2 className="text-lg font-semibold">
              {t("profile.basicInformation")}
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <div>
                <label className="text-sm text-slate-300">
                  {t("registration.fullName")}
                </label>

                <input
                  type="text"
                  defaultValue={user?.name || ""}
                  className="mt-2 w-full rounded-lg border border-ink-300 bg-ink px-4 py-3 text-sm text-slate outline-none transition focus:border-brass"
                  placeholder={t("profile.fullNamePlaceholder")}
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">
                  {t("auth.email")}
                </label>

                <input
                  type="email"
                  defaultValue={user?.email || ""}
                  disabled
                  className="mt-2 w-full cursor-not-allowed rounded-lg border border-ink-300 bg-ink-100 px-4 py-3 text-sm text-slate-400"
                />

                <p className="mt-2 text-xs text-slate-400">
                  {t("profile.emailCannotChange")}
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm text-slate-300">
                  {t("profile.headline")}
                </label>

                <input
                  type="text"
                  className="mt-2 w-full rounded-lg border border-ink-300 bg-ink px-4 py-3 text-sm text-slate outline-none transition focus:border-brass"
                  placeholder={t("profile.headlinePlaceholder")}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm text-slate-300">
                  {t("profile.about")}
                </label>

                <textarea
                  rows="6"
                  className="mt-2 w-full resize-none rounded-lg border border-ink-300 bg-ink px-4 py-3 text-sm leading-relaxed text-slate outline-none transition focus:border-brass"
                  placeholder={t("profile.aboutPlaceholder")}
                />
              </div>

            </div>
          </div>

          {/* Education */}
          <div className="mt-8 border-t border-ink-300 pt-7">

            <h2 className="text-lg font-semibold">
              {t("profile.education")}
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <div>
                <label className="text-sm text-slate-300">
                  {t("registration.university")}
                </label>

                <input
                  type="text"
                  defaultValue="University of Gondar"
                  className="mt-2 w-full rounded-lg border border-ink-300 bg-ink px-4 py-3 text-sm text-slate outline-none focus:border-brass"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">
                  {t("profile.department")}
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
              {t("profile.skills")}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {t("profile.skillsHint")}
            </p>

            <input
              type="text"
              className="mt-5 w-full rounded-lg border border-ink-300 bg-ink px-4 py-3 text-sm text-slate outline-none focus:border-brass"
              placeholder={t("profile.skillsPlaceholder")}
            />

          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-ink-300 pt-6 sm:flex-row sm:justify-end">

            <Link
              to="/profile"
              className="rounded-lg border border-ink-300 px-5 py-3 text-center text-sm font-medium text-slate-300 transition hover:border-slate-400 hover:text-slate"
            >
              {t("common.cancel")}
            </Link>

            <button
              type="button"
              className="rounded-lg bg-brass px-5 py-3 text-sm font-semibold text-ink transition hover:opacity-90"
            >
              {t("profile.saveChanges")}
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}
