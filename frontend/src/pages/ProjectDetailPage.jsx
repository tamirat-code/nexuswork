import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, Clock, DollarSign, Star, CheckCircle2, Send, Sparkles, 
  MapPin, Users, Calendar, Globe, Award, TrendingUp, FileText,
  Bookmark, Share2, MessageSquare, Paperclip
} from "lucide-react";
import { MOCK_PROJECTS } from "../data/projects";
import { useNotifications } from "../context/NotificationContext";
import ProjectCard from "../components/marketplace/ProjectCard";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const project = MOCK_PROJECTS.find((p) => p.id === id);
  const { notify } = useNotifications();

  const [coverLetter, setCoverLetter] = useState("");
  const [bidAmount, setBidAmount] = useState(project?.budget || "");
  const [deliveryDays, setDeliveryDays] = useState("14");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!project) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Project not found</h2>
          <Link to="/projects" className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmitProposal = (e) => {
    e.preventDefault();
    if (!coverLetter.trim()) {
      notify("Please write a cover letter.", "error");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      notify("Proposal submitted successfully! The client will be notified.", "success");
      setCoverLetter("");
    }, 1500);
  };

  const relatedProjects = MOCK_PROJECTS.filter(p => p.id !== id).slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Back Navigation */}
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
        <ArrowLeft className="h-4 w-4" /> Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
        {/* LEFT COLUMN: Project Details */}
        <div className="space-y-6">
          {/* Project Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            {/* Badges */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {project.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Award className="h-3 w-3" /> Featured
                </span>
              )}
              {project.urgent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400">
                  Urgent Hire
                </span>
              )}
              {project.matchScore >= 90 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Sparkles className="h-3 w-3" /> {project.matchScore}% AI Match
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-zinc-300">
                {project.experienceLevel}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {project.title}
            </h1>
            
            {/* Meta Info */}
            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-zinc-200">
                <DollarSign className="h-4 w-4" /> 
                {project.budgetType === "fixed" ? `$${project.budget} Fixed` : `$${project.budget}/hr`}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Posted {project.posted}
              </span>
              <span className="flex items-center gap-1.5">
                <Send className="h-4 w-4" /> {project.proposals} proposals
              </span>
              {project.remote && (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" /> Remote
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setSaved(!saved)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                  saved 
                    ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300"
                }`}
              >
                <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                {saved ? "Saved" : "Save Project"}
              </button>
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>

          {/* Project Description */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Project Description</h2>
            <p className="text-sm leading-7 text-slate-600 dark:text-zinc-300 whitespace-pre-wrap">
              {project.description}
            </p>

            {/* Requirements */}
            <div className="mt-8 border-t border-slate-100 pt-6 dark:border-white/5">
              <h3 className="mb-3 text-base font-bold text-slate-900 dark:text-white">Requirements</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-zinc-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span>Experience with {project.skills.slice(0, 2).join(" and ")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span>Ability to deliver within {project.estimatedDuration}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span>Strong communication skills and regular progress updates</span>
                </li>
              </ul>
            </div>

            {/* Skills */}
            <div className="mt-8 border-t border-slate-100 pt-6 dark:border-white/5">
              <h3 className="mb-3 text-base font-bold text-slate-900 dark:text-white">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {project.skills.map((skill) => (
                  <span key={skill} className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:border-blue-500/20 dark:from-blue-500/5 dark:to-indigo-500/5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Compatibility Insights</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-4 w-4 text-emerald-500" />
                <div>
                  <p className="font-semibold text-slate-700 dark:text-zinc-200">High success probability</p>
                  <p className="text-slate-500 dark:text-zinc-400">Your skills match {project.matchScore}% of project requirements</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-semibold text-slate-700 dark:text-zinc-200">Competition level: Medium</p>
                  <p className="text-slate-500 dark:text-zinc-400">{project.proposals} proposals submitted, {Math.floor(project.proposals * 0.3)} from verified students</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-amber-500" />
                <div>
                  <p className="font-semibold text-slate-700 dark:text-zinc-200">Recommended bid: ${Math.floor(project.budget * 0.9)}-${project.budget}</p>
                  <p className="text-slate-500 dark:text-zinc-400">Based on market rates and your experience level</p>
                </div>
              </div>
            </div>
          </div>

          {/* Client Profile Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">About the Client</h2>
            <div className="flex items-start gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white">
                {project.client.name.charAt(0)}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{project.client.name}</h3>
                  {project.client.verified && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                </div>
                
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {project.client.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-amber-500" /> 
                    {project.client.rating} ({project.client.reviews} reviews)
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Total Spent</p>
                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">${project.client.spent.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Hired</p>
                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{project.client.totalHired}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Response Time</p>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{project.client.responseTime}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Member Since</p>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{project.client.memberSince}</p>
                  </div>
                </div>

                {project.client.paymentVerified && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Payment method verified
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related Projects */}
          {relatedProjects.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Similar Projects</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {relatedProjects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sticky Proposal Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="mb-5 text-xl font-bold text-slate-900 dark:text-white">Submit a Proposal</h2>
            
            <form onSubmit={handleSubmitProposal} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-zinc-300">Your Bid (USD)</label>
                <div className="relative">
                  <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number" 
                    value={bidAmount} 
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" 
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
                  Recommended: ${Math.floor(project.budget * 0.9)} - ${project.budget}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-zinc-300">Delivery Time (Days)</label>
                <input 
                  type="number" 
                  value={deliveryDays} 
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" 
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-zinc-300">Cover Letter</label>
                <textarea 
                  rows="6"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself and explain why you're the best fit for this project..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                />
                <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
                  {coverLetter.length} / 1000 characters
                </p>
              </div>

              <button 
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
              >
                <Paperclip className="h-4 w-4" /> Attach Portfolio (Optional)
              </button>

              <button 
                type="submit" 
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl disabled:opacity-60"
              >
                {submitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Submit Proposal
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 dark:text-zinc-500">
                You'll be notified when the client responds
              </p>
            </form>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-zinc-400">Your Success Rate</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">85%</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-zinc-400">Average Response</span>
              <span className="font-bold text-slate-700 dark:text-zinc-200">2 hours</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}