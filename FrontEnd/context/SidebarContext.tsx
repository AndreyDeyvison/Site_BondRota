'use client';

import { createContext, useMemo, useState, type ReactNode } from 'react';

export interface SidebarContextValue {
  /** Controla a visibilidade do menu lateral em telas estreitas (off-canvas). */
  open: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const value = useMemo<SidebarContextValue>(() => ({
    open,
    openSidebar: () => setOpen(true),
    closeSidebar: () => setOpen(false),
  }), [open]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
