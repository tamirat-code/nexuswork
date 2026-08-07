import { useQuery } from "@tanstack/react-query";
import { checkBackendHealth } from "../../services/api/health.api";

export default function BackendStatus() {
  const { isLoading, isError, data } = useQuery({
    queryKey: ["backend-health"],
    queryFn: checkBackendHealth,
    retry: 1,
  });

  if (isLoading) {
    return <p className="text-gray-600">Checking backend...</p>;
  }

  if (isError) {
    return (
      <p className="text-red-600">
        Backend is not reachable. Make sure the Express server is running.
      </p>
    );
  }

  return <p className="text-green-600">{data.message}</p>;
}