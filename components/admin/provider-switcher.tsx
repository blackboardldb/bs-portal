// Provider Switcher Component
// Allows administrators to switch between mock and prisma providers

"use client";

import { useState, useEffect } from "react";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Database,
  Server,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface ProviderHealth {
  type: "mock" | "prisma";
  status: "healthy" | "unhealthy";
  details: {
    connectionTime?: number;
    error?: string;
    recordCount?: number;
  };
}

interface ProviderStats {
  type: "mock" | "prisma";
  operationCount: number;
  averageResponseTime: number;
  errorCount: number;
  lastOperation?: string;
}

export function ProviderSwitcher() {
  const { currentProviderType, switchProvider, getProviderHealth, isLoading } =
    useBlackSheepStore();

  const [health, setHealth] = useState<ProviderHealth | null>(null);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load provider info on mount and when provider changes
  useEffect(() => {
    loadProviderInfo();
  }, [currentProviderType]);

  const loadProviderInfo = async () => {
    try {
      const healthData = await getProviderHealth();
      setHealth(healthData);

      // Get stats from API
      const response = await fetch("/api/system/provider");
      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
      }
    } catch (err) {
      console.error("Failed to load provider info:", err);
      setError("Failed to load provider information");
    }
  };

  const handleSwitchProvider = async (targetProvider: "mock" | "prisma") => {
    if (targetProvider === currentProviderType) return;

    setSwitching(true);
    setError(null);

    try {
      // Call API to switch provider
      const response = await fetch("/api/system/provider", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider: targetProvider }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to switch provider");
      }

      // Update store
      const success = await switchProvider(targetProvider);

      if (!success) {
        throw new Error("Failed to update store with new provider");
      }

      // Reload provider info
      await loadProviderInfo();
    } catch (err) {
      console.error("Provider switch failed:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setSwitching(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "unhealthy":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case "mock":
        return <Server className="h-4 w-4" />;
      case "prisma":
        return <Database className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Provider Management
          </CardTitle>
          <CardDescription>
            Switch between mock and database providers for development and
            production
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Current Provider Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {getProviderIcon(currentProviderType)}
              <div>
                <div className="font-medium capitalize">
                  {currentProviderType} Provider
                </div>
                <div className="text-sm text-muted-foreground">
                  Currently active data provider
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {health && getStatusIcon(health.status)}
              <Badge
                variant={
                  health?.status === "healthy" ? "default" : "destructive"
                }
              >
                {health?.status || "Unknown"}
              </Badge>
            </div>
          </div>

          {/* Provider Health Details */}
          {health && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded">
                <div className="text-sm font-medium">Connection</div>
                <div className="text-2xl font-bold">
                  {health.details.connectionTime
                    ? `${health.details.connectionTime}ms`
                    : "N/A"}
                </div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-sm font-medium">Records</div>
                <div className="text-2xl font-bold">
                  {health.details.recordCount || 0}
                </div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-sm font-medium">Operations</div>
                <div className="text-2xl font-bold">
                  {stats?.operationCount || 0}
                </div>
              </div>
            </div>
          )}

          {/* Provider Statistics */}
          {stats && (
            <div className="space-y-2">
              <h4 className="font-medium">Performance Statistics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    Avg Response Time:
                  </span>
                  <span className="ml-2 font-medium">
                    {stats.averageResponseTime}ms
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Error Count:</span>
                  <span className="ml-2 font-medium">{stats.errorCount}</span>
                </div>
                {stats.lastOperation && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">
                      Last Operation:
                    </span>
                    <span className="ml-2 font-medium">
                      {stats.lastOperation}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Provider Switch Controls */}
          <div className="space-y-3">
            <h4 className="font-medium">Switch Provider</h4>
            <div className="flex gap-2">
              <Button
                variant={currentProviderType === "mock" ? "default" : "outline"}
                onClick={() => handleSwitchProvider("mock")}
                disabled={
                  switching || isLoading || currentProviderType === "mock"
                }
                className="flex-1"
              >
                {switching && currentProviderType !== "mock" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Server className="h-4 w-4 mr-2" />
                )}
                Mock Provider
              </Button>
              <Button
                variant={
                  currentProviderType === "prisma" ? "default" : "outline"
                }
                onClick={() => handleSwitchProvider("prisma")}
                disabled={
                  switching || isLoading || currentProviderType === "prisma"
                }
                className="flex-1"
              >
                {switching && currentProviderType !== "prisma" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Prisma Provider
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Switching providers will refresh all data and may take a few
              seconds
            </div>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            onClick={loadProviderInfo}
            disabled={isLoading || switching}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Refresh Provider Info
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
