import React from "react";
import { Outlet } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}

