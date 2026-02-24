import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/dashboard';
    // Use production URL — request.url origin resolves to internal host on Render
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;

    if (code) {
        const supabase = await supabaseServer();

        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(`${siteUrl}${next}`);
        } else {
            console.error('Auth Callback Error:', error.message);
        }
    }

    // If error or no code, redirect to login with error
    return NextResponse.redirect(`${siteUrl}/login?error=auth_callback_failed`);
}
