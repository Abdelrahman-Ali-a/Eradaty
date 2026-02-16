"use client";

import React from "react";
import Image from "next/image";

export function EradatyLogo({ className = "h-auto w-auto" }: { className?: string }) {
    return (
        <Image
            src="/eradaty-logo-custom.png"
            alt="Eradaty Logo"
            width={220}
            height={60}
            className={className}
            priority
            style={{ width: 'auto', height: 'auto' }}
        />
    );
}
