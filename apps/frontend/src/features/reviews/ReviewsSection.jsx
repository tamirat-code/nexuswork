import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { submitReview, getUserReviews } from "../../services/api/reviews.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatDate } from "../../utils/date.utils.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Textarea } from "../../components/ui/shadcn/textarea.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/shadcn/dialog.jsx";

function StarRating({ value, onChange, readOnly = false }) {
  const size = readOnly ? "h-4 w-4" : "h-6 w-6";
  return (
    <div className="flex items-center gap-0.5" role={readOnly ? "img" : undefined} aria-label={readOnly ? `${value} out of 5 stars` : "Rating"}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={readOnly ? "cursor-default" : "cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"}
        >
          <Star className={`${size} ${n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ contractId, onDone }) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () => submitReview(contractId, { rating, comment }, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review submitted — thanks for the feedback");
      onDone?.();
    },
    onError: (err) => toast.error(err.message || "Could not submit review"),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-slate">Your rating</p>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="review-comment" className="text-sm font-semibold text-slate">Written review</label>
        <Textarea id="review-comment" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the collaboration? Timeliness, quality, communication…" />
      </div>
      <Button className="w-full" disabled={rating === 0} loading={mutation.isPending} onClick={() => mutation.mutate()}>
        Submit review
      </Button>
    </div>
  );
}

export default function ReviewsSection({ userId, contractId, showForm = false }) {
  const { data, isLoading } = useQuery({
    queryKey: ["reviews", userId],
    queryFn: () => getUserReviews(userId),
    enabled: !!userId,
  });
  const reviews = data?.data ?? [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Reviews</CardTitle>
        {showForm && contractId && (
          <Dialog>
            <DialogTrigger asChild><Button size="sm">Leave a review</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Review this collaboration</DialogTitle>
                <DialogDescription>Your rating and feedback help the community trust verified work.</DialogDescription>
              </DialogHeader>
              <ReviewForm contractId={contractId} />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-24 w-full" />}
        {!isLoading && reviews.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-300">No reviews yet.</p>
        )}
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r._id} className="rounded-card border border-ink-300 bg-ink-700 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} readOnly />
                  <span className="font-mono text-sm text-slate-300">{r.rating}.0</span>
                </div>
                <span className="text-xs text-slate-300">{formatDate(r.createdAt)}</span>
              </div>
              {r.comment && <p className="mt-2 text-sm leading-relaxed text-slate-300">{r.comment}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-xs">On-time</Badge>
                <Badge variant="secondary" className="text-xs">Quality work</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
