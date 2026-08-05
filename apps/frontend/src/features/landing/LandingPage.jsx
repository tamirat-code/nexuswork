import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="max-w-3xl mx-auto text-center mt-24 px-6">
      <h1 className="text-4xl font-semibold">Where student talent meets real work.</h1>
      <p className="text-gray-600 mt-4">
        NexusWork connects verified university students with clients who need real projects done —
        with escrow-protected payments every step of the way.
      </p>
      <div className="flex justify-center gap-3 mt-8">
        <Link to="/projects" className="bg-black text-white rounded px-5 py-2.5 text-sm">
          Browse Projects
        </Link>
        <Link to="/register" className="border rounded px-5 py-2.5 text-sm">
          Sign up
        </Link>
      </div>
    </div>
  );
}
