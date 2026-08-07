import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, DollarSign, Star, Sparkles, CheckCircle2, Send, Bookmark, Share2, Zap, Flame, Paperclip } from "lucide-react";
import { motion } from "framer-motion";

export default function ProjectCard({ project, onSave }) {
  const [saved, setSaved] = useState(false);
  const isHighMatch = project.matchScore >= 90;

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(!saved);
    if (onSave) onSave(project.id, !saved);
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.origin + `/projects/${project.id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link 
        to={`/projects/${project.id}`}
        className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-blue-500/40"
      >
        {/* Badges */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {project.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Zap className="h-3 w-3" /> Featured
              </span>
            )}
            {project.urgent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600 dark:text-red-400">
                <Flame className="h-3 w-3" /> Urgent
              </span>
            )}
            {isHighMatch && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                <Sparkles className="h-3 w-3" /> {project.matchScore}% Match
              </span>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-blue-400"
              aria-label={saved ? "Remove from saved" : "Save project"}
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={handleShare}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-blue-400"
              aria-label="Share project"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="mb-2 text-lg font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {project.title}
        </h3>
        <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
          {project.description}
        </p>

        {/* Skills */}
        <div className="mb-5 flex flex-wrap gap-2">
          {project.skills.slice(0, 4).map((skill) => (
            <span key={skill} className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-white/5 dark:text-zinc-300">
              {skill}
            </span>
          ))}
          {project.skills.length > 4 && (
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:bg-white/5 dark:text-zinc-500">
              +{project.skills.length - 4}
            </span>
          )}
        </div>

        {/* Footer: Stats & Client */}
        <div className="mt-auto border-t border-slate-100 pt-4 dark:border-white/5">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-zinc-200">
              <DollarSign className="h-3.5 w-3.5" /> 
              {project.budgetType === "fixed" ? `$${project.budget}` : `$${project.budget}/hr`}
            </span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {project.estimatedDuration}</span>
            <span className="flex items-center gap-1"><Send className="h-3.5 w-3.5" /> {project.proposals}</span>
            {project.attachments > 0 && (
              <span className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" /> {project.attachments}</span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white">
                {project.client.name.charAt(0)}
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">{project.client.name}</span>
                  {project.client.verified && <CheckCircle2 className="h-3 w-3 text-blue-500" />}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Star className="h-2.5 w-2.5 fill-current text-amber-500" />
                  <span className="font-semibold text-amber-500">{project.client.rating}</span>
                  <span>· ${project.client.spent.toLocaleString()} spent</span>
                </div>
              </div>
            </div>
            
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">{project.posted}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}