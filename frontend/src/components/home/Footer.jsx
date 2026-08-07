import { GraduationCap } from "lucide-react";
import Container from "../ui/Container";
import { footerLinks } from "../../data/home";

// Professional Inline SVGs for Brand Icons (Bypasses Lucide Trademark Restrictions)
const FacebookIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

const XIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const InstagramIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const GithubIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const socials = [
  { name: "Facebook", icon: FacebookIcon, href: "https://facebook.com" },
  { name: "X (Twitter)", icon: XIcon, href: "https://twitter.com" },
  { name: "LinkedIn", icon: LinkedinIcon, href: "https://linkedin.com" },
  { name: "Instagram", icon: InstagramIcon, href: "https://instagram.com" },
  { name: "GitHub", icon: GithubIcon, href: "https://github.com" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      id="footer"
      className="scroll-mt-24 border-t border-slate-200 bg-slate-50 pb-10 pt-16 dark:border-slate-800 dark:bg-slate-950"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
                <GraduationCap className="h-6 w-6" aria-hidden="true" />
              </span>

             <div className="text-lg font-extrabold text-slate-900 dark:text-white">
  NexusWork
</div>
<div className="text-sm text-slate-500 dark:text-slate-400">
  The University-Verified Freelance Network
</div>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
              A university-connected platform where verified students find freelance
              projects, build portfolios, and earn income safely through milestone-based
              escrow payments.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {socials.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.name}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition hover:border-primary/30 hover:text-primary dark:border-slate-700 dark:text-slate-300 dark:hover:text-blue-300"
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {footerLinks.map((column) => (
              <nav key={column.title} aria-label={`${column.title} links`}>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-slate-900 dark:text-white">
                  {column.title}
                </h3>

                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#top"
                        className="text-sm text-slate-600 transition hover:text-primary dark:text-slate-300 dark:hover:text-blue-300"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 md:flex-row">
         <p>
  © {year} NexusWork. All rights reserved.
</p>

          <p>Built for students, clients, universities, and administrators.</p>
        </div>
      </Container>
    </footer>
  );
}