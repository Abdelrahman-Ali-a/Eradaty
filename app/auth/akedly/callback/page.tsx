"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function AkeledyCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

    useEffect(() => {
        const callbackStatus = searchParams.get("status");
        const error = searchParams.get("error");

        if (callbackStatus === "success") {
            setStatus("success");
            // Redirect to onboarding after a short delay to show success
            setTimeout(() => {
                router.push("/onboarding");
            }, 2000);
        } else if (callbackStatus === "failed") {
            setStatus("failed");
            console.error("Akedly verification failed:", error);
            // Redirect back to signup after showing error
            setTimeout(() => {
                router.push("/signup?error=phone_verification_failed");
            }, 3000);
        } else {
            // No status param — might be a direct visit
            router.push("/signup");
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4 p-8">
                {status === "loading" && (
                    <>
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                        <p className="text-lg text-muted-foreground">Processing verification...</p>
                    </>
                )}
                {status === "success" && (
                    <>
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                        <h2 className="text-xl font-bold text-foreground">Phone Verified!</h2>
                        <p className="text-muted-foreground">Redirecting you to setup...</p>
                    </>
                )}
                {status === "failed" && (
                    <>
                        <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                        <h2 className="text-xl font-bold text-foreground">Verification Failed</h2>
                        <p className="text-muted-foreground">Redirecting back to signup...</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default function AkeledyCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                </div>
            }
        >
            <AkeledyCallbackContent />
        </Suspense>
    );
}
