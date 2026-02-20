"use client";
import { createContext, useContext, useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { usePathname, useRouter } from "next/navigation";
import { navItems } from "@/lib/nav";
import { toast } from "sonner";

interface UserContextType {
    user: any;
    brand: any;
    role: "owner" | "admin" | "editor" | "viewer" | null;
    allowed_pages: string[] | null;
    isLoading: boolean;
    canAccess: (path: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { data, loading } = useApi<any>("/api/profile");
    const pathname = usePathname();
    const router = useRouter();

    const role = data?.role || null;
    const allowed_pages: string[] | null = data?.allowed_pages ?? null;

    // Determine if a given path is accessible
    const canAccess = (path: string): boolean => {
        // Owners and admins always have full access
        if (role === "owner" || role === "admin") return true;
        // If no restrictions set, allow all (null = unrestricted)
        if (!allowed_pages) return true;
        // Check if the path is in the allowed list
        return allowed_pages.some(p => path === p || path.startsWith(p + "/"));
    };

    // Route guard: redirect if user navigates to a restricted page
    useEffect(() => {
        if (loading || !data || !pathname) return;
        // Only enforce on nav pages (not profile, auth pages, etc.)
        const isNavPage = navItems.some(item => pathname === item.path || pathname.startsWith(item.path + "/"));
        if (!isNavPage) return;

        if (!canAccess(pathname)) {
            toast.error("You don't have access to this page.");
            router.replace("/dashboard");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, data, loading]);

    return (
        <UserContext.Provider value={{
            user: data?.user,
            brand: data?.brand,
            role,
            allowed_pages,
            isLoading: loading,
            canAccess,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within UserProvider");
    return context;
};
