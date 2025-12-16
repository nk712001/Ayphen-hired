import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // Super Admin Routes
        if (path.startsWith("/super-admin")) {
            if (token?.role !== "SUPER_ADMIN") {
                return NextResponse.redirect(new URL("/auth/login", req.url));
            }
        }

        // Company Admin Routes
        if (path.startsWith("/company")) {
            if (token?.role !== "COMPANY_ADMIN") {
                return NextResponse.redirect(new URL("/auth/login", req.url));
            }
        }

        // Recruiter (Interviewer) Routes
        if (path.startsWith("/interviewer")) {
            // Allow both RECRUITER and COMPANY_ADMIN to access interviewer portal features
            if (token?.role !== "RECRUITER" && token?.role !== "COMPANY_ADMIN") {
                return NextResponse.redirect(new URL("/auth/login", req.url));
            }
        }
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: [
        "/super-admin/:path*",
        "/company/:path*",
        "/interviewer/:path*",
    ],
};
