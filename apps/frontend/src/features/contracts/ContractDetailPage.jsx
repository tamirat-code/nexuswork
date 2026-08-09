import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getContract } from "../../services/api/contracts.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import Spinner from "../../components/loaders/Spinner.jsx";

export default function ContractDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["contract", id],
    queryFn: () => getContract(id, token),
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  if (error) return <p className="p-6 text-center text-brick">{error.message}</p>;

  const contract = data.data;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl text-slate">Contract</h1>
      <p className="mt-2 text-slate-300">Status: {contract.status}</p>
      <p className="mt-4 text-sm text-slate-300">
        Milestones, messaging, and file exchange for this contract go here.
      </p>
    </div>
  );
}