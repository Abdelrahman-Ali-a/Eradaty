import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: Request) {
    const requestUrl = new URL(request.url);
    const supabase = await supabaseServer();

    // Sign out the user, which clears the session cookies
    await supabase.auth.signOut();

    // Redirect to the login page
    return NextResponse.redirect(`${requestUrl.origin}/login`, {
        status: 303, // 303 See Other is appropriate for redirect after POST
    });
}
