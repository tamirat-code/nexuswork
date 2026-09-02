import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  BadgeCheck,
  CheckCircle2,
  Eye,
  FileText,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  listIncomingProposals,
  listMyProposals,
  acceptProposal,
  rejectProposal,
  withdrawProposal,
  markProposalCvViewed,
} from "../../services/api/proposals.api.js";

import { useAuth } from "../../hooks/useAuth.js";

import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";

import { StatusBadge } from "../../components/ui/shadcn/status-badge.jsx";
import {
  Card,
  CardContent,
} from "../../components/ui/shadcn/card.jsx";

import { Badge } from "../../components/ui/shadcn/badge.jsx";

import {
  Button,
} from "../../components/ui/shadcn/button.jsx";

import {
  Skeleton,
} from "../../components/ui/shadcn/skeleton.jsx";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/shadcn/table.jsx";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/shadcn/dialog.jsx";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/shadcn/avatar.jsx";

import { ROLES } from "../../constants/roles.constants.js";
import { PROPOSAL_STATUS } from "../../constants/status.constants.js";
import { fetchFileBlob, openFilePreview } from "../../services/api/files.api.js";


function EmptyProposals({ isClient }) {
  return (
    <Card className="px-6 py-16 text-center">
      <FileText className="mx-auto h-10 w-10 text-slate-300" />

      <h3 className="mt-4 font-display text-lg text-slate">
        {isClient
          ? "No incoming proposals"
          : "No proposals yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-300">
        {isClient
          ? "When students submit proposals to your projects, they will appear here."
          : "Browse open projects and submit a proposal with your price and timeline."}
      </p>

      {!isClient && (
        <Link
          to="/projects"
          className="mt-6 inline-block"
        >
          <Button>
            Browse projects
          </Button>
        </Link>
      )}
    </Card>
  );
}


function ProposalReviewDialog({
  proposal,
  open,
  onOpenChange,
  onAccept,
  onReject,
  accepting,
  rejecting,
  cvViewed,
  onCvViewed,
  token,
}) {
  const [cvUrl, setCvUrl] = useState(null);

  useEffect(() => {
    setCvUrl(null);
  }, [proposal?._id, open]);

  if (!proposal) return null;
  const openCv = async () => {
    try {
      const blob = await fetchFileBlob(proposal.cv_file_id._id, token);
      setCvUrl((previous) => {
        if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous);
        return URL.createObjectURL(blob);
      });
      await onCvViewed?.(proposal._id);
    } catch (error) {
      toast.error(error.message || "Could not open the student's CV");
    }
  };

  const student = proposal.student_id || {};
  const project = proposal.project_id || {};

  const initials = (student.name || "Student")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();


  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">

        <DialogHeader>
          <DialogTitle>
            Review proposal
          </DialogTitle>

          <DialogDescription>
            Review the student's offer before accepting
            or rejecting it.
          </DialogDescription>
        </DialogHeader>


        <div className="space-y-5">

          {/* Student */}
          <section className="rounded-card border border-ink-300 p-4">

            <p className="text-[10px] font-semibold uppercase tracking-wider text-brass">
              Student
            </p>

            <div className="mt-3 flex items-center gap-3">

              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={student.avatarUrl}
                  alt=""
                />

                <AvatarFallback>
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-2">

                  <p className="font-semibold text-slate">
                    {student.name || "Student"}
                  </p>

                  {student.universityVerified && (
                    <Badge variant="success">
                      <BadgeCheck className="h-3 w-3" />
                      University verified
                    </Badge>
                  )}

                </div>

                {student.headline && (
                  <p className="mt-1 text-sm text-slate-300">
                    {student.headline}
                  </p>
                )}

                {student.university && (
                  <p className="mt-1 text-xs text-slate-300">
                    {student.university}
                  </p>
                )}

              </div>
            </div>


            {student.bio && (
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                {student.bio}
              </p>
            )}

          </section>


          {/* Project */}
          <section>

            <p className="text-[10px] font-semibold uppercase tracking-wider text-brass">
              Project
            </p>

            <h3 className="mt-1 font-display text-xl text-slate">
              {project.title || "Project"}
            </h3>

            {project.description && (
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {project.description}
              </p>
            )}

          </section>


          {/* Offer */}
          <section className="grid gap-3 sm:grid-cols-2">

            <div className="rounded-card border border-brass/30 bg-brass/5 p-4">

              <p className="text-xs text-slate-300">
                Student's offer
              </p>

              <p className="mt-1 font-display text-2xl text-brass">
                {formatCurrency(proposal.price, proposal.project_id?.currency || "USD")}
              </p>

            </div>


            <div className="rounded-card border border-ink-300 p-4">

              <p className="text-xs text-slate-300">
                Delivery time
              </p>

              <p className="mt-1 font-display text-2xl text-slate">
                {proposal.delivery_time_days} days
              </p>

            </div>

          </section>


          {/* Cover note */}
          <section>

            <p className="text-[10px] font-semibold uppercase tracking-wider text-brass">
              Proposal / Cover note
            </p>

            <div className="mt-2 rounded-card border border-ink-300 p-4">

              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                {proposal.cover_note ||
                  "No cover note provided."}
              </p>

            </div>

          </section>

          {proposal.cv_file_id ? (
            <button type="button" onClick={openCv} className="inline-flex items-center gap-2 text-sm font-semibold text-brass hover:underline">
              <FileText className="h-4 w-4" /> {cvViewed ? "CV reviewed" : "View student CV"} ({proposal.cv_file_id.original_name})
            </button>
          ) : <p className="text-sm text-brick">This proposal has no CV attached and cannot be accepted.</p>}

          {cvUrl && (
            <div className="overflow-hidden rounded-card border border-ink-300 bg-white">
              <iframe
                title={`CV for ${student.name || "student"}`}
                src={cvUrl}
                className="h-[min(65vh,720px)] w-full"
              />
            </div>
          )}


          {/* Status */}
          <div className="flex items-center justify-between rounded-control border border-ink-300 p-3">

            <span className="text-xs text-slate-300">
              Proposal status
            </span>

            <StatusBadge
              kind="proposal"
              status={proposal.status}
              showDot
            />

          </div>


          {/* Important contract information */}
          {proposal.status === PROPOSAL_STATUS.PENDING && (
            <section className="rounded-control border border-brass/30 bg-brass/5 p-4">

              <p className="font-semibold text-slate">
                Before you accept
              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                Accepting this proposal will create a
                contract using the student's offer.
                Both you and the student must confirm
                the contract before milestones can be
                funded.
              </p>

            </section>
          )}

        </div>


        {proposal.status === PROPOSAL_STATUS.PENDING && (
          <DialogFooter className="gap-2">

            <Button
              variant="danger"
              size="sm"
              loading={rejecting}
              disabled={accepting}
              onClick={onReject}
            >
              <XCircle className="h-4 w-4" />
              Reject proposal
            </Button>

            <Button
              size="sm"
              loading={accepting}
              disabled={rejecting || !cvViewed}
              onClick={onAccept}
            >
              <CheckCircle2 className="h-4 w-4" />
              Accept & create contract
            </Button>

          </DialogFooter>
        )}

      </DialogContent>
    </Dialog>
  );
}


export default function ProposalsPage() {

  const { token, user } = useAuth();

  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const isClient =
    user?.role === ROLES.CLIENT ||
    user?.role === ROLES.ADMIN;


  /*
   * The notification system sends:
   *
   * /proposals?proposalId=XXXXXXXX
   *
   * This state automatically opens that proposal.
   */
  const requestedProposalId =
    searchParams.get("proposalId");

  const [selectedProposal, setSelectedProposal] =
    useState(null);

  const [reviewOpen, setReviewOpen] =
    useState(false);
  const [cvViewed, setCvViewed] = useState(false);


  /*
   * CLIENT:
   *     GET /proposals/incoming
   *
   * STUDENT:
   *     GET /proposals
   */
  const {
    data,
    isLoading,
    error,
  } = useQuery({

    queryKey: isClient
      ? ["incoming-proposals"]
      : ["my-proposals"],

    queryFn: () =>
      isClient
        ? listIncomingProposals(token)
        : listMyProposals(token),

    enabled: !!token,

  });


  /*
   * Backend response:
   *
   * {
   *   success: true,
   *   data: [...]
   * }
   */
  const proposals = useMemo(() => {

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (
      Array.isArray(
        data?.data?.proposals
      )
    ) {
      return data.data.proposals;
    }

    return [];

  }, [data]);


  /*
   * Notification → proposal
   *
   * Once the proposal list has loaded, find
   * the requested proposal and open it.
   */
  useEffect(() => {

    if (!requestedProposalId) {
      return;
    }

    if (!proposals.length) {
      return;
    }

    const proposal = proposals.find(
      (item) =>
        String(item._id) ===
        String(requestedProposalId)
    );

    if (!proposal) {
      toast.error(
        "The requested proposal could not be found."
      );

      setSearchParams(
        {},
        { replace: true }
      );

      return;
    }

    setSelectedProposal(proposal);
    setCvViewed(String(proposal.cv_viewed_by) === String(user?.id || user?._id));
    setReviewOpen(true);

    /*
     * Remove proposalId from the URL after opening.
     *
     * This prevents the same dialog from reopening
     * after a refresh/navigation.
     */
    setSearchParams(
      {},
      { replace: true }
    );

  }, [
    requestedProposalId,
    proposals,
    user,
    setSearchParams,
  ]);


  /*
   * ACCEPT
   */
  const acceptMutation = useMutation({

    mutationFn: (id) =>
      acceptProposal(id, token),

    onSuccess: (response) => {

      queryClient.invalidateQueries({
        queryKey: ["incoming-proposals"],
      });

      queryClient.invalidateQueries({
        queryKey: ["my-proposals"],
      });

      queryClient.invalidateQueries({
        queryKey: ["contracts"],
      });

      const contractId =
        response?.data?.contract?._id;

      setReviewOpen(false);
      setSelectedProposal(null);

      toast.success(
        contractId
          ? "Proposal accepted. Contract created."
          : "Proposal accepted."
      );

    },

    onError: (err) => {

      toast.error(
        err.message ||
        "Could not accept proposal"
      );

    },

  });

  const cvViewedMutation = useMutation({
    mutationFn: (id) => markProposalCvViewed(id, token),
    onSuccess: (_response, id) => {
      setCvViewed(true);
      queryClient.setQueryData(isClient ? ["incoming-proposals"] : ["my-proposals"], (current) => ({
        ...current,
        data: (current?.data || []).map((item) => String(item._id) === String(id)
          ? { ...item, cv_viewed_by: user?.id || user?._id, cv_viewed_at: new Date().toISOString() }
          : item),
      }));
    },
    onError: (err) => toast.error(err.message || "Could not record CV review"),
  });


  /*
   * REJECT
   */
  const rejectMutation = useMutation({

    mutationFn: (id) =>
      rejectProposal(id, token),

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey: ["incoming-proposals"],
      });

      queryClient.invalidateQueries({
        queryKey: ["my-proposals"],
      });

      setReviewOpen(false);
      setSelectedProposal(null);

      toast.success(
        "Proposal rejected."
      );

    },

    onError: (err) => {

      toast.error(
        err.message ||
        "Could not reject proposal"
      );

    },

  });


  /*
   * STUDENT WITHDRAW
   */
  const withdrawMutation = useMutation({

    mutationFn: (id) =>
      withdrawProposal(id, token),

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey: ["my-proposals"],
      });

      toast.success(
        "Proposal withdrawn."
      );

    },

    onError: (err) => {

      toast.error(
        err.message ||
        "Could not withdraw proposal"
      );

    },

  });


  const openReview = (proposal) => {

    setSelectedProposal(proposal);
    setCvViewed(String(proposal.cv_viewed_by) === String(user?.id || user?._id));
    setReviewOpen(true);

  };


  if (isLoading) {

    return (
      <div className="space-y-4">

        <Skeleton className="h-8 w-56" />

        <Skeleton className="h-28 w-full" />

        <Skeleton className="h-28 w-full" />

        <Skeleton className="h-28 w-full" />

      </div>
    );

  }


  if (error) {

    return (
      <Card className="p-8 text-center">

        <h2 className="font-display text-lg text-slate">
          Couldn't load proposals
        </h2>

        <p className="mt-2 text-sm text-slate-300">
          {error.message}
        </p>

      </Card>
    );

  }


  if (proposals.length === 0) {

    return (
      <EmptyProposals
        isClient={isClient}
      />
    );

  }


  return (
    <div className="w-full animate-fade-up">

      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-300 pb-5">

        <div>

          <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">
            {isClient
              ? "Hiring inbox"
              : "Your activity"}
          </p>

          <h1 className="mt-1 font-display text-2xl leading-tight tracking-tight text-slate">

            {isClient
              ? "Incoming proposals"
              : "My proposals"}

          </h1>

          <p className="mt-1.5 text-sm text-slate-300">

            {proposals.length} proposal
            {proposals.length === 1
              ? ""
              : "s"} total

          </p>

        </div>


        {!isClient && (

          <Link to="/projects">

            <Button
              variant="secondary"
              size="sm"
            >
              Find more projects
            </Button>

          </Link>

        )}

      </header>


      {/* CLIENT VIEW */}
      {isClient ? (

        <div className="mt-6 space-y-3">

          {proposals.map((proposal) => {

            const student =
              proposal.student_id || {};

            const initials =
              (student.name || "Student")
                .split(/\s+/)
                .slice(0, 2)
                .map(
                  (part) => part[0]
                )
                .join("")
                .toUpperCase();


            return (

              <Card
                key={proposal._id}
                className="overflow-hidden transition-colors hover:border-brass/30"
              >

                <CardContent className="p-5">

                  <div className="flex flex-wrap items-start justify-between gap-4">

                    {/* Student */}
                    <div className="flex min-w-0 items-center gap-3">

                      <Avatar className="h-11 w-11">

                        <AvatarImage
                          src={student.avatarUrl}
                          alt=""
                        />

                        <AvatarFallback>
                          {initials}
                        </AvatarFallback>

                      </Avatar>


                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <p className="font-semibold text-slate">
                            {student.name ||
                              "Student"}
                          </p>

                          {student.universityVerified && (

                            <Badge variant="success">

                              <BadgeCheck className="h-3 w-3" />

                              University verified

                            </Badge>

                          )}

                        </div>


                        {student.headline && (

                          <p className="mt-1 text-xs text-slate-300">
                            {student.headline}
                          </p>

                        )}

                      </div>

                    </div>


                    {/* Price */}
                    <div className="text-right">

                      <p className="font-mono text-xl font-semibold text-brass">
                        {formatCurrency(
                          proposal.price
                        )}
                      </p>

                      <p className="text-xs text-slate-300">
                        {proposal.delivery_time_days}
                        {" "}
                        days
                      </p>

                    </div>

                  </div>


                  {/* Project */}
                  <div className="mt-4 rounded-control border border-ink-300 p-3">

                    <p className="text-[10px] font-semibold uppercase tracking-wider text-brass">
                      Project
                    </p>

                    <p className="mt-1 font-medium text-slate">

                      {proposal.project_id?.title ||
                        "Project"}

                    </p>

                  </div>


                  {/* Cover note */}
                  <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-slate-300">

                    {proposal.cover_note ||
                      "No cover note provided."}

                  </p>


                  {/* Footer */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-300 pt-4">

                    <div className="flex items-center gap-3">

                      <StatusBadge
                        kind="proposal"
                        status={proposal.status}
                        showDot
                      />

                      <span className="text-xs text-slate-300">
                        {formatDate(
                          proposal.createdAt
                        )}
                      </span>

                    </div>


                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        openReview(proposal)
                      }
                    >

                      <Eye className="h-4 w-4" />

                      Review proposal

                    </Button>

                  </div>

                </CardContent>

              </Card>

            );

          })}

        </div>

      ) : (

        /* STUDENT VIEW */
        <Card className="mt-6 overflow-hidden">

          <CardContent className="p-0">

            <Table>

              <TableHeader>

                <TableRow>

                  <TableHead>
                    Project
                  </TableHead>

                  <TableHead className="text-right">
                    Price
                  </TableHead>

                  <TableHead className="text-right">
                    Timeline
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead className="text-right">
                    Submitted
                  </TableHead>

                  <TableHead
                    className="w-16"
                    aria-label="Actions"
                  />

                </TableRow>

              </TableHeader>


              <TableBody>

                {proposals.map((proposal) => (

                  <TableRow
                    key={proposal._id}
                  >

                    <TableCell>

                      <Link
                        to={`/projects/${proposal.project_id?._id}`}
                        className="font-semibold text-slate hover:text-brass"
                      >
                        {proposal.project_id?.title ||
                          "Project"}
                      </Link>

                    </TableCell>


                    <TableCell className="text-right font-mono text-brass">

                      {formatCurrency(
                        proposal.price
                      )}

                    </TableCell>


                    <TableCell className="text-right font-mono text-slate-300">

                      {proposal.delivery_time_days}d

                    </TableCell>


                    <TableCell>

                      <StatusBadge
                        kind="proposal"
                        status={proposal.status}
                        showDot
                      />

                    </TableCell>


                    <TableCell className="text-right text-sm text-slate-300">

                      {formatDate(
                        proposal.createdAt
                      )}

                    </TableCell>


                    <TableCell className="text-right">

                      {proposal.status ===
                        PROPOSAL_STATUS.PENDING && (

                        <Dialog>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-brick"
                            aria-label="Withdraw proposal"
                            onClick={() =>
                              withdrawMutation.mutate(
                                proposal._id
                              )
                            }
                            disabled={
                              withdrawMutation.isPending
                            }
                          >

                            <Trash2 className="h-4 w-4" />

                          </Button>

                        </Dialog>

                      )}

                    </TableCell>

                  </TableRow>

                ))}

              </TableBody>

            </Table>

          </CardContent>

        </Card>

      )}


      {/* REVIEW DIALOG */}

      <ProposalReviewDialog

        proposal={selectedProposal}

        open={reviewOpen}

        onOpenChange={(open) => {

          setReviewOpen(open);

          if (!open) {
            setSelectedProposal(null);
            setCvViewed(false);
          }

        }}

        accepting={
          acceptMutation.isPending
        }

        rejecting={
          rejectMutation.isPending
        }

        cvViewed={cvViewed}
        token={token}
        onCvViewed={(id) => cvViewedMutation.mutateAsync(id)}

        onAccept={() => {

          if (!selectedProposal) {
            return;
          }

          acceptMutation.mutate(
            selectedProposal._id
          );

        }}

        onReject={() => {

          if (!selectedProposal) {
            return;
          }

          rejectMutation.mutate(
            selectedProposal._id
          );

        }}

      />

    </div>
  );
}
