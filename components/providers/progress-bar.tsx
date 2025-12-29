"use client";

import { ProgressProvider } from "@bprogress/next/app";

export function ProgressBarProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProgressProvider
            height="5px"
            color="#3b82f6"
            options={{ showSpinner: false }}
            shallowRouting
        >
            {children}
        </ProgressProvider>
    );
}
