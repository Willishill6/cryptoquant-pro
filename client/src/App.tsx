import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AlertProvider } from "./contexts/AlertContext";
import { TradingProvider } from "./contexts/TradingContext";
import { SystemStatusProvider } from "./contexts/SystemStatusContext";
import DashboardLayout from "./components/DashboardLayout";
import CommandPalette from "./components/CommandPalette";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import ScrollToTop from "./components/ScrollToTop";
import PageTransition from "./components/PageTransition";
import { PageSkeleton } from "./components/Skeleton";

/* ─── Dashboard 直接导入（首页不分割，确保最快加载） ─── */
import Dashboard from "./pages/Dashboard";

/* ─── 其他页面懒加载（按需加载，减少首屏体积） ─── */
const TradingEngine = lazy(() => import("./pages/TradingEngine"));
const Strategies = lazy(() => import("./pages/Strategies"));
const AlphaFactors = lazy(() => import("./pages/AlphaFactors"));
const AISystem = lazy(() => import("./pages/AISystem"));
const RiskManagement = lazy(() => import("./pages/RiskManagement"));
const DataAnalytics = lazy(() => import("./pages/DataAnalytics"));
const Monitoring = lazy(() => import("./pages/Monitoring"));
const Settings = lazy(() => import("./pages/Settings"));
const HistoryLearning = lazy(() => import("./pages/HistoryLearning"));
const AIEvolutionLab = lazy(() => import("./pages/AIEvolutionLab"));
const TradeHistory = lazy(() => import("./pages/TradeHistory"));

/** Page wrapper with transition and lazy loading fallback */
function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageTransition>
        {children}
      </PageTransition>
    </Suspense>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path={"/"}>
        <DashboardLayout>
          <PageTransition><Dashboard /></PageTransition>
        </DashboardLayout>
      </Route>
      <Route path={"/trading"}>
        <DashboardLayout>
          <PageWrap><TradingEngine /></PageWrap>
        </DashboardLayout>
      </Route>
      <Route path={"/strategies"}>
        <DashboardLayout>
          <PageWrap><Strategies /></PageWrap>
        </DashboardLayout>
      </Route>
      <Route path={"/factors"}>
        <DashboardLayout>
          <PageWrap><AlphaFactors /></PageWrap>
        </DashboardLayout>
      </Route>
      <Route path={"/ai"}>
        <DashboardLayout>
          <PageWrap><AISystem /></PageWrap>
        </DashboardLayout>
      </Route>
      <Route path={"/risk"}>
        <DashboardLayout>
          <PageWrap><RiskManagement /></PageWrap>
        </DashboardLayout>
      </Route>
      <Route path={"/data"}>
        <DashboardLayout>
          <PageWrap><DataAnalytics /></PageWrap>
        </DashboardLayout>
      </Route>
      <Route path={"/monitoring"}>
        <DashboardLayout>
          <PageWrap><Monitoring /></PageWrap>
        </DashboardLayout>
      </Route>
      <Route path={"/history-learning"}>
        <DashboardLayout>
          <PageWrap><HistoryLearning /></PageWrap>
        </DashboardLayout>
      </Route>
      <Route path={"/ai-evolution"}>
        <DashboardLayout>
          <PageWrap><AIEvolutionLab /></PageWrap>
        </DashboardLayout>
      </Route>
      <Route path={"/trades"}>
        <DashboardLayout>
          <PageWrap><TradeHistory /></PageWrap>
        </DashboardLayout>
      </Route>
      <Route path={"/settings"}>
        <DashboardLayout>
          <PageWrap><Settings /></PageWrap>
        </DashboardLayout>
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <AlertProvider>
          <SystemStatusProvider>
            <TradingProvider>
            <TooltipProvider>
              <WouterRouter hook={useHashLocation}>
                <Toaster />
                <CommandPalette />
                <KeyboardShortcuts />
                <ScrollToTop />
                <AppRouter />
              </WouterRouter>
            </TooltipProvider>
            </TradingProvider>
          </SystemStatusProvider>
        </AlertProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
