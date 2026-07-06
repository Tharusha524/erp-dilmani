import { DefaultOptions, QueryClient } from "@tanstack/react-query";

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 0,
    networkMode: "online",
  },
  mutations: {
    networkMode: "offlineFirst",
  },
};

const queryClient = new QueryClient({ defaultOptions });

export default queryClient;
