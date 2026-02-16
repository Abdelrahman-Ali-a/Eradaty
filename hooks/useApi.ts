import { useState, useEffect, useCallback } from "react";

export interface UseApiResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useApi<T>(endpoint: string, options?: { skip?: boolean }): UseApiResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(!options?.skip);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (options?.skip) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(endpoint);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: "Failed to fetch data" }));
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }

            const json = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
            console.error(`API Error [${endpoint}]:`, err);
        } finally {
            setLoading(false);
        }
    }, [endpoint, options?.skip]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
