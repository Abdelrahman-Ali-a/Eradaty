import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: Request) {
    const supabase = await supabaseServer();
    // Use production URL — requestUrl.origin resolves to localhost:10000 on Render
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;

    // Sign out the user, which clears the session cookies
    await supabase.auth.signOut();

    // Redirect to the login page
    return NextResponse.redirect(`${siteUrl}/login`, {
        status: 303,
    });
}
