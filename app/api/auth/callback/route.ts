import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = await supabaseServer();

        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(`${requestUrl.origin}${next}`);
        } else {
            console.error('Auth Callback Error:', error.message);
        }
    }

    // If error or no code, redirect to login with error
    return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_failed`);
}
