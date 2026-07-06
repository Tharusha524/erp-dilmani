// hooks/useCurrentUser.ts
import { useQuery } from "@tanstack/react-query";
import { User, validateUser } from "../api/userApi";

interface UseCurrentUserResult {
  user: User | null;
  status: "error" | "success" | "pending" | "loading" | "idle";
}

function useCurrentUser(): UseCurrentUserResult {
  const token = localStorage.getItem("token");

  const { data, status } = useQuery<User>({
    queryKey: ["current-user"],
    queryFn: validateUser,
    enabled: !!token, // only fetch if token exists
    retry: false, // optional: prevent retry on 401
  });

  return { user: data ?? null, status };
}

export default useCurrentUser;
