import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { GuestBanner } from "./components/GuestBanner";
import { LoginModal } from "./components/LoginModal";
import { type PageId, Sidebar } from "./components/Sidebar";
import { BalanceSheetPage } from "./components/pages/BalanceSheetPage";
import { BillGeneratorPage } from "./components/pages/BillGeneratorPage";
import { BusinessHistoryPage } from "./components/pages/BusinessHistoryPage";
import { CashFlowPage } from "./components/pages/CashFlowPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { DataAnalystPage } from "./components/pages/DataAnalystPage";
import { GSTPage } from "./components/pages/GSTPage";
import { HistoryPage } from "./components/pages/HistoryPage";
import { ItemCatalogPage } from "./components/pages/ItemCatalogPage";
import { PLPage } from "./components/pages/PLPage";
import { YearAnalystPage } from "./components/pages/YearAnalystPage";
import { AuthProvider } from "./contexts/AuthContext";

function AppInner() {
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage onNavigate={setCurrentPage} />;
      case "analyst":
        return <DataAnalystPage />;
      case "year-analyst":
        return <YearAnalystPage />;
      case "business-history":
        return <BusinessHistoryPage />;
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
      case "item-catalog":
        return <ItemCatalogPage />;
      case "bill-generator":
        return <BillGeneratorPage />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden dark">
      <GuestBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="pt-14 lg:pt-0">{renderPage()}</div>
        </main>
      </div>
      <LoginModal />
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

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
