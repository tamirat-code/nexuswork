import { Link } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-brass">Error 404</p>
      <h1 className="mt-3 font-display text-3xl text-slate">This page isn't on the board</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        The link may be out of date, or the project you were looking for has been closed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link to="/projects">
          <Button>Browse projects</Button>
        </Link>
        <Link to="/">
          <Button variant="secondary">Back home</Button>
        </Link>
      </div>
    </div>
  );
}
