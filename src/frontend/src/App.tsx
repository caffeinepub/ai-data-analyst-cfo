import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar, type PageId } from "./components/Sidebar";
import { DashboardPage } from "./components/pages/DashboardPage";
import { DataAnalystPage } from "./components/pages/DataAnalystPage";
import { PLPage } from "./components/pages/PLPage";
import { BalanceSheetPage } from "./components/pages/BalanceSheetPage";
import { CashFlowPage } from "./components/pages/CashFlowPage";
import { GSTPage } from "./components/pages/GSTPage";
import { HistoryPage } from "./components/pages/HistoryPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage onNavigate={setCurrentPage} />;
      case "analyst":
        return <DataAnalystPage />;
      case "pl":
        return <PLPage />;
      case "balance-sheet":
        return <BalanceSheetPage />;
      case "cash-flow":
        return <CashFlowPage />;
      case "gst":
        return <GSTPage />;
      case "history":
        return <HistoryPage />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden dark">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(prev => !prev)}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile top pad for hamburger button */}
        <div className="pt-14 lg:pt-0">
          {renderPage()}
        </div>
      </main>

      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "oklch(0.165 0.018 255)",
            border: "1px solid oklch(0.26 0.03 255)",
            color: "oklch(0.94 0.008 255)",
          },
        }}
      />
    </div>
  );
}
