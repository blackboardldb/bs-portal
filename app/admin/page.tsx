"use client";

import { AdminDashboard } from "../../components/admincomponents/admin-dashboard";

export default function AdminPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">BlackSheep Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Panel de administración completo para BlackSheep CrossFit
        </p>
      </div>
      <AdminDashboard />
    </div>
  );
}
