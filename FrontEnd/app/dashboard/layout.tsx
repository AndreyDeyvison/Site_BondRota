import Sidebar from '@/components/dashboard/Sidebar';
import { SidebarProvider } from '@/context/SidebarContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: '#F1F4F8' }}>
        <Sidebar />
        <main className="flex-1 lg:ml-64 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
