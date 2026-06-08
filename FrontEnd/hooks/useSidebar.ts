'use client';

import { useContext } from 'react';
import { SidebarContext, type SidebarContextValue } from '@/context/SidebarContext';

/** Acesso ao estado do menu lateral off-canvas (mobile/tablet). */
export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar precisa ser usado dentro de um <SidebarProvider>.');
  }
  return context;
}
