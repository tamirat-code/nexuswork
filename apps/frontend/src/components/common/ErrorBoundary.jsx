import { Component } from "react";
import { logger } from "../../lib/logger.js";

export default class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { logger.error("Unhandled React rendering error", error, { componentStack: info?.componentStack }); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <main className="grid min-h-screen place-items-center bg-ink p-6 text-center text-slate"><section><h1 className="font-display text-2xl">Something went wrong</h1><p className="mt-2 text-sm text-slate-300">The page could not be displayed. Reload and try again.</p><button type="button" onClick={() => window.location.reload()} className="mt-5 rounded bg-brass px-4 py-2 font-semibold text-ink">Reload page</button></section></main>;
  }
}
