





import { motion } from "framer-motion";
import { 
  GraduationCap, Briefcase, Building2, ShieldCheck, 
  CheckCircle2 
} from "lucide-react";

const ACCOUNT_TYPES = [
  {
    id: "student",
    title: "Student Freelancer",
    description: "Showcase your verified skills and earn from real projects",
    icon: GraduationCap,
    gradient: "from-blue-500 to-indigo-600",
    benefits: [
      "University-verified profile badge",
      "Access to AI-matched projects",
      "Build a professional portfolio",
      "Escrow-protected payments",
    ],
  },
  {
    id: "client",
    title: "Client / Employer",
    description: "Hire verified student talent for your projects",
    icon: Briefcase,
    gradient: "from-teal-500 to-emerald-600",
    benefits: [
      "Access to verified talent pool",
      "Milestone-based escrow payments",
      "AI-powered candidate matching",
      "Quality guarantee on deliverables",
    ],
  },
  {
    id: "university_staff",
    title: "University Staff",
    description: "Verify students and track employment outcomes",
    icon: Building2,
    gradient: "from-purple-500 to-pink-600",
    benefits: [
      "Verify student identities and skills",
      "View employment analytics",
      "Manage institutional reputation",
      "Track graduate outcomes",
    ],
  },
  // ← ADD THIS NEW ENTRY
  {
    id: "admin",
    title: "Platform Administrator",
    description: "Oversee the NexusWork platform and resolve disputes",
    icon: ShieldCheck,
    gradient: "from-rose-500 to-red-600",
    benefits: [
      "Full platform oversight",
      "User & dispute management",
      "Revenue & analytics access",
      "Fraud detection tools",
    ],
  },
];

export default function AccountTypeStep({ value, onChange }) {
  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
        How will you use NexusWork?
      </h2>
      <p className="mb-8 text-sm text-slate-500 dark:text-zinc-400">
        Choose the account type that best describes you. You can always update this later.
      </p>

      <div className="space-y-3">
        {ACCOUNT_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.id;

          return (
            <motion.button
              key={type.id}
              type="button"
              onClick={() => onChange(type.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`group relative w-full overflow-hidden rounded-2xl border-2 p-5 text-left transition-all duration-300 ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10 dark:bg-blue-500/10"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${type.gradient} text-white shadow-lg`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {type.title}
                    </h3>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                    {type.description}
                  </p>

                  {isSelected && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 space-y-1.5"
                    >
                      {type.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          {benefit}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}