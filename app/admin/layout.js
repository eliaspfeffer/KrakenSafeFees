"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Prüfe, ob der Benutzer berechtigt ist (sollte durch Middleware gesichert sein)
  React.useEffect(() => {
    if (
      status === "unauthenticated" ||
      (status === "authenticated" &&
        session.user.email !== "eliaspfeffer@googlemail.com")
    ) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (
    status === "unauthenticated" ||
    (status === "authenticated" &&
      session?.user?.email !== "eliaspfeffer@googlemail.com")
  ) {
    return null; // Die Middleware sollte den Benutzer umleiten
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Admin Header mit Navigation */}
      <header className="navbar bg-base-300 text-base-content shadow-lg">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-200 rounded-box w-52"
            >
              <li>
                <Link href="/admin">Dashboard</Link>
              </li>
              <li>
                <Link href="/dashboard">Zurück zur App</Link>
              </li>
            </ul>
          </div>
          <Link href="/admin" className="btn btn-ghost text-xl">
            Admin-Bereich
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li>
              <Link href="/dashboard">Zurück zur App</Link>
            </li>
          </ul>
        </div>
        <div className="navbar-end">
          {session?.user?.email && (
            <div className="flex items-center">
              <span className="mr-2">{session.user.email}</span>
              {session.user.image && (
                <div className="avatar">
                  <div className="w-8 rounded-full">
                    <img
                      src={session.user.image}
                      alt={session.user.name || "Avatar"}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Hauptinhalt */}
      {children}
    </div>
  );
}
