import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import crypto from "crypto";

const AKEDLY_API_KEY = process.env.AKEDLY_API_KEY!;
const WIDGET_PUBLIC_KEY = process.env.AKEDLY_WIDGET_PUBLIC_KEY!;
const WIDGET_SECRET = process.env.AKEDLY_WIDGET_SECRET!;

function generateSignature(
    apiKey: string,
    publicKey: string,
    secret: string,
    timestamp: number,
    phoneNumber: string
): string {
    const message = JSON.stringify({
        apiKey,
        publicKey,
        timestamp,
        phoneNumber,
    });

    return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

export async function POST(request: NextRequest) {
    try {
        // Verify user is authenticated
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    },
                },
            }
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { phoneNumber, email } = body;

        if (!phoneNumber) {
            return NextResponse.json(
                { success: false, error: "Phone number is required" },
                { status: 400 }
            );
        }

        // Validate E.164 phone number format
        const e164Regex = /^\+[1-9]\d{1,14}$/;
        if (!e164Regex.test(phoneNumber)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Phone number must be in E.164 format (e.g., +201234567890)",
                },
                { status: 400 }
            );
        }

        const timestamp = Date.now();

        const signature = generateSignature(
            AKEDLY_API_KEY,
            WIDGET_PUBLIC_KEY,
            WIDGET_SECRET,
            timestamp,
            phoneNumber
        );

        const response = await fetch(
            "https://api.akedly.io/api/v1/widget-sdk/create-attempt",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    apiKey: AKEDLY_API_KEY,
                    publicKey: WIDGET_PUBLIC_KEY,
                    signature,
                    timestamp,
                    verificationAddress: {
                        phoneNumber,
                        ...(email ? { email } : {}),
                    },
                    digits: 6,
                    publicMetadata: {
                        userId: user.id,
                    },
                    privateMetadata: {
                        supabaseUserId: user.id,
                        phoneNumber,
                    },
                }),
            }
        );

        const data = await response.json();

        if (data.status === "error" || !response.ok) {
            console.error("Akedly API error:", data);
            return NextResponse.json(
                {
                    success: false,
                    error: data.message || "Failed to create verification attempt",
                    code: data.code,
                },
                { status: response.status || 500 }
            );
        }

        return NextResponse.json({
            success: true,
            attemptId: data.data.attemptId,
            iframeUrl: data.data.iframeUrl,
            expiresAt: data.data.expiresAt,
        });
    } catch (error: any) {
        console.error("Create attempt error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
