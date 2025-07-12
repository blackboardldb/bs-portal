"use client";

import { ReactNode } from "react";

interface ClassProcessorProviderProps {
  children: ReactNode;
}

export function ClassProcessorProvider({
  children,
}: ClassProcessorProviderProps) {
  // NOTE: Class processing is now handled in the backend
  // This provider is kept for potential future client-side processing needs

  return <>{children}</>;
}
