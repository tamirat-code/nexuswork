import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  ChevronDown,
  LogOut,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { SealMark } from "../../features/auth/components/AuthShell.jsx";
import Button from "../ui/Button.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const profileRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const links = [
    {
      to: "/",
      label: "Home",
    },
    {
      to: "/projects",
      label: "Browse projects",
    },
    {
      to: "/search",
      label: "Search",
    },
    {
      to: "/students",
      label: "Students",
    },
    {
      to: "/university",
      label: "University",
    },
    {
      to: "/about",
      label: "About",
    },

    ...(user?.role === "client"
      ? [
          {
            to: "/projects/new",
            label: "Post a project",
          },
        ]
      : []),

    ...(user
      ? [
          {
            to: "/dashboard",
            label: "Dashboard",
          },
          {
            to: "/wallet",
            label: "Wallet",
          },
        ]
      : []),
  ];

  const linkClass = ({ isActive }) =>
    `text-sm transition-colors ${
      isActive
        ? "font-semibold text-brass"
        : "text-slate-300 hover:text-slate"
    }`;

  const profileImage =
    user?.avatar ||
    user?.avatarUrl ||
    user?.profileImage ||
    user?.profile_image ||
    null;

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "User";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isStudent = user?.role === "student";

  const isVerified =
    user?.verification_status === "verified" ||
    user?.verificationStatus === "verified" ||
    user?.verified === true;

  return (
    <header className="sticky top-0 z-50 border-b border-ink-300 bg-ink/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* =================================================
            LOGO
        ================================================= */}
        <Link
          to="/"
          className="flex items-center gap-2"
        >
          <SealMark className="h-6 w-6 text-brass" />

          <span className="font-display text-lg font-semibold tracking-tight text-slate">
            NexusWork
          </span>
        </Link>

        {/* =================================================
            DESKTOP NAVIGATION
        ================================================= */}
        <nav
          aria-label="Main"
          className="hidden items-center gap-6 md:flex"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={
                link.to === "/" ||
                link.to === "/projects"
              }
              className={linkClass}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* =================================================
            DESKTOP USER / AUTH
        ================================================= */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div
              ref={profileRef}
              className="relative"
              onMouseEnter={() => setProfileOpen(true)}
              onMouseLeave={() => setProfileOpen(false)}
            >
              {/* Profile trigger */}
              <button
                type="button"
                onClick={() =>
                  setProfileOpen((value) => !value)
                }
                className="flex items-center gap-2 rounded-full border border-ink-300 bg-ink-50 p-1.5 pr-3 transition hover:border-brass/40"
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
              >
                {/* Avatar */}
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={displayName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brass/15 text-[11px] font-bold text-brass">
                    {initials}
                  </div>
                )}

                <span className="max-w-[110px] truncate text-xs font-semibold text-slate">
                  {displayName}
                </span>

                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                    profileOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {/* Profile dropdown */}
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -6,
                      scale: 0.98,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: -6,
                      scale: 0.98,
                    }}
                    transition={{
                      duration: 0.15,
                    }}
                    className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-2xl border border-ink-300 bg-ink-50 p-2 shadow-2xl"
                  >
                    {/* User information */}
                    <div className="border-b border-ink-300 px-3 py-3">
                      <div className="flex items-center gap-3">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt={displayName}
                            className="h-10 w-10 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brass/15 text-xs font-bold text-brass">
                            {initials}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-slate">
                              {displayName}
                            </p>

                            {isVerified && (
                              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            )}
                          </div>

                          <p className="mt-0.5 truncate text-[11px] capitalize text-slate-500">
                            {user?.role || "member"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Profile */}
                    <Link
                      to={isStudent ? "/profile" : "/dashboard"}
                      className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-ink hover:text-slate"
                      onClick={() =>
                        setProfileOpen(false)
                      }
                    >
                      <UserRound className="h-4 w-4 text-brass" />

                      <div>
                        <p className="font-medium">
                          Profile
                        </p>

                        <p className="text-[10px] text-slate-500">
                          View your profile
                        </p>
                      </div>
                    </Link>

                    {/* Logout */}
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-brick transition hover:bg-brick/10"
                    >
                      <LogOut className="h-4 w-4" />

                      <div>
                        <p className="font-medium">
                          Log out
                        </p>

                        <p className="text-[10px] text-brick/70">
                          Sign out of NexusWork
                        </p>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="px-1 text-sm font-medium text-slate-300 transition-colors hover:text-slate"
              >
                Log in
              </Link>

              <Link to="/register">
                <Button size="sm">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* =================================================
            MOBILE MENU BUTTON
        ================================================= */}
        <button
          type="button"
          className="-mr-2 p-2 text-slate md:hidden"
          aria-label={
            mobileOpen
              ? "Close menu"
              : "Open menu"
          }
          aria-expanded={mobileOpen}
          onClick={() =>
            setMobileOpen((value) => !value)
          }
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {mobileOpen ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M6 18L18 6" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* =================================================
          MOBILE NAVIGATION
      ================================================= */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            aria-label="Mobile"
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
            }}
            className="overflow-hidden border-t border-ink-300 bg-ink md:hidden"
          >
            <div className="flex flex-col gap-3 px-6 py-4 text-sm">

              {/* Mobile profile */}
              {user && (
                <div className="mb-1 rounded-2xl border border-ink-300 bg-ink-50 p-3">
                  <div className="flex items-center gap-3">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={displayName}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brass/15 text-xs font-bold text-brass">
                        {initials}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-semibold text-slate">
                          {displayName}
                        </p>

                        {isVerified && (
                          <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                      </div>

                      <p className="text-[11px] capitalize text-slate-500">
                        {user?.role || "member"}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={isStudent ? "/profile" : "/dashboard"}
                    className="mt-3 flex items-center gap-2 rounded-xl bg-ink px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:text-brass"
                  >
                    <UserRound className="h-4 w-4 text-brass" />
                    View profile
                  </Link>
                </div>
              )}

              {/* Mobile links */}
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={
                    link.to === "/" ||
                    link.to === "/projects"
                  }
                  className={linkClass}
                >
                  {link.label}
                </NavLink>
              ))}

              {/* Divider */}
              <div className="my-1 h-px bg-ink-300" />

              {/* Mobile authentication */}
              {user ? (
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 text-left font-medium text-brick"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-slate-300 transition-colors hover:text-slate"
                  >
                    Log in
                  </Link>

                  <Link
                    to="/register"
                    className="font-semibold text-brass"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}