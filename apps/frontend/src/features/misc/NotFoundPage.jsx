import { Link } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center animate-fade-up">
      <p className="font-mono text-5xl font-bold tracking-tight text-brass/40">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate sm:text-3xl">This page isn't on the board</h1>
      <p className="mt-2.5 max-w-md text-sm leading-relaxed text-slate-300">
        The link may be out of date, or the project you were looking for has been closed or moved.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link to="/projects">
          <Button size="md">Browse projects</Button>
        </Link>
        <Link to="/">
          <Button variant="secondary" size="md">Back home</Button>
        </Link>
      </div>
    </div>
  );
}
