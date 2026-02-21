import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key for admin operations (updating user profiles)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            status,
            widgetAttempt,
            transaction,
            publicMetadata,
            privateMetadata,
            error: akeledyError,
        } = body;

        console.log("Akedly webhook received:", {
            status,
            attemptId: widgetAttempt?.attemptId,
            transactionId: transaction?.transactionID,
        });

        if (status === "success") {
            const userId = privateMetadata?.supabaseUserId;
            const phoneNumber = privateMetadata?.phoneNumber || transaction?.verificationAddress?.phoneNumber;

            if (!userId) {
                console.error("No supabaseUserId in privateMetadata");
                return NextResponse.json({ received: true }, { status: 200 });
            }

            // Update the user's profile with verified phone number
            const { error: updateError } = await supabaseAdmin
                .from("profiles")
                .upsert(
                    {
                        id: userId,
                        phone: phoneNumber,
                        phone_verified: true,
                        phone_verified_at: new Date().toISOString(),
                    },
                    { onConflict: "id" }
                );

            if (updateError) {
                console.error("Failed to update profile:", updateError);
            } else {
                console.log(`User ${userId} phone verified successfully: ${phoneNumber}`);
            }

            // Also update Supabase auth user metadata
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                phone: phoneNumber,
                user_metadata: {
                    phone_verified: true,
                    phone_number: phoneNumber,
                },
            });

            if (authError) {
                console.error("Failed to update auth user metadata:", authError);
            }
        } else {
            // Log failed verification
            console.log("Akedly verification failed:", {
                attemptId: widgetAttempt?.attemptId,
                errorCode: akeledyError?.code,
                errorMessage: akeledyError?.message,
            });
        }

        // Always respond with 200 to acknowledge receipt
        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error: any) {
        console.error("Webhook processing error:", error);
        // Still respond with 200 to prevent retries
        return NextResponse.json(
            { received: true, error: error.message },
            { status: 200 }
        );
    }
}
