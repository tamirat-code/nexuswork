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

  if (isLoading) return <div className="p-6">{<Spinner />}</div>;
  if (error) return <p className="p-6 text-red-600">{error.message}</p>;

  const contract = data.data;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold">Contract</h1>
      <p className="text-gray-600 mt-2">Status: {contract.status}</p>
      <p className="text-gray-500 mt-4 text-sm">
        Milestones, messaging, and file exchange for this contract go here.
      </p>
    </div>
  );
}
