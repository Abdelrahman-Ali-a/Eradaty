import { AppLayout } from "@/components/layout/AppLayout";
import { UserProvider } from "@/contexts/UserContext";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            <AppLayout>{children}</AppLayout>
        </UserProvider>
    );
}
