import { useState, Suspense, lazy } from "react";
import "./App.css";
import { useTrades }        from "./hooks/useTrades";
import { useSettings }      from "./hooks/useSettings";
import { useTheme }         from "./hooks/useTheme";
import { useAuth }          from "./hooks/useAuth";
import { useAccounts }      from "./hooks/useAccounts";
import { useSupabase }      from "./hooks/useSupabase";
import { useNotifications } from "./hooks/useNotifications";
import { usePlaybook }        from "./hooks/usePlaybook";
import { useDailyJournal }     from "./hooks/useDailyJournal";

// ── Always-loaded (above the fold / critical) ─────────────────────
import NotificationsContainer from "./components/Notifications";
import Header                 from "./components/Header";
import AuthPage               from "./components/AuthPage";
import AccountSwitcher        from "./components/AccountSwitcher";
import ErrorBoundary          from "./components/ErrorBoundary";
import TradeForm              from "./components/TradeForm";
import { DashboardSkeleton, TableSkeleton, PageSkeleton, CardListSkeleton } from "./components/Skeleton";
import GlobalSearch            from "./components/GlobalSearch";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { usePageTitle }         from "./hooks/usePageTitle";
import Onboarding, { useOnboarding } from "./components/Onboarding";
import { generatePdfReport }  from "./utils/pdfReport";

// ── Lazy-loaded (only when tab is visited) ────────────────────────
const Dashboard       = lazy(() => import("./components/Dashboard"));
const Journal         = lazy(() => import("./components/Journal"));
const Analytics       = lazy(() => import("./components/Analytics"));
const Settings        = lazy(() => import("./components/Settings").then(m => ({ default: m.default })));
const SettingsStatus  = lazy(() => import("./components/SupabaseStatus"));
const RiskCalculator  = lazy(() => import("./components/pages/RiskCalculator"));
const TradingCalendar = lazy(() => import("./components/pages/TradingCalendar"));
const Insights        = lazy(() => import("./components/pages/Insights"));
const Review          = lazy(() => import("./components/pages/Review"));
const Playbook          = lazy(() => import("./components/pages/Playbook"));
const DailyJournal      = lazy(() => import("./components/pages/DailyJournal"));
const TradeReplay       = lazy(() => import("./components/pages/TradeReplay"));
const SharePerformance  = lazy(() => import("./components/pages/SharePerformance"));

const TABS = ["dashboard", "journal", "analytics", "calendar", "insights", "review", "playbook", "daily", "replay", "share", "risk", "settings"];

// ── Tab-specific skeleton fallbacks ──────────────────────────────
function TabFallback({ tab }) {
  if (tab === "dashboard") return <DashboardSkeleton />;
  if (tab === "journal")   return <TableSkeleton rows={7} />;
  if (tab === "playbook" || tab === "review") return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
      <CardListSkeleton count={5} />
      <PageSkeleton />
    </div>
  );
  return <PageSkeleton />;
}

// ── Full-screen auth loading ──────────────────────────────────────
function AuthLoading({ theme: t }) {
  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 6, color: t.accent }}>TRADEBOOK</div>
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: "50%", background: t.accent,
            animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Main app ──────────────────────────────────────────────────────
export default function TradingJournal() {
  const [activeTab,  setActiveTab]  = useState("dashboard");
  const [pdfMonth,   setPdfMonth]   = useState("");

  const { theme, themeName, toggleTheme }                           = useTheme();
  const { settings, updateSettings, resetSettings, currencyMeta }   = useSettings();
  const authHook     = useAuth();
  const supabaseHook = useSupabase();
  const accountsHook = useAccounts();

  const {
    trades, form, setForm,
    filterMarket, setFilterMarket,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    editingTrade, showAddForm,
    filteredTrades, stats, equityCurve,
    marketBreakdown, strategyStats, monthlyPnl, emotionStats,
    openAddForm, openEditForm, closeForm,
    handleSubmit, handleDelete, handleImport,
  } = useTrades(settings.capitalInitial, accountsHook.activeAccountId);

  const { toasts, dismissToast } = useNotifications({ stats, settings, currencyMeta });
  const playbookHook    = usePlaybook();
  const dailyJournalHook = useDailyJournal();

  // ── Page title
  usePageTitle(activeTab);

  // ── Onboarding
  const onboarding = useOnboarding();

  // ── Keyboard shortcuts ────────────────────────────────────────
  useKeyboardShortcuts({
    setActiveTab,
    onAddTrade:   openAddForm,
    onCloseForm:  closeForm,
    showForm:     showAddForm,
  });

  // ── Auth gate ────────────────────────────────────────────────
  if (authHook.loading) return <AuthLoading theme={theme} />;

  if (!authHook.user) {
    return (
      <AuthPage
        onSignIn={authHook.signIn}
        onSignUp={authHook.signUp}
        onResendConfirmation={authHook.resendConfirmation}
        loading={authHook.loading}
        error={authHook.error}
        onClearError={() => authHook.setError("")}
        theme={theme}
      />
    );
  }

  return (
    <div style={{ fontFamily: "'DM Mono', 'Courier New', monospace", background: theme.bg, minHeight: "100vh", color: theme.text }}>

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddTrade={openAddForm}
        themeName={themeName}
        onToggleTheme={toggleTheme}
        theme={theme}
        syncing={supabaseHook.syncing}
        tabs={TABS}
        user={authHook.user}
        profile={authHook.profile}
        onSignOut={authHook.signOut}
        globalSearch={
          <GlobalSearch trades={trades} onNavigate={setActiveTab} currencyMeta={currencyMeta} theme={theme} />
        }
        accountSwitcher={
          <AccountSwitcher
            accounts={accountsHook.accounts}
            activeAccount={accountsHook.activeAccount}
            onSwitch={accountsHook.switchAccount}
            onAdd={accountsHook.addAccount}
            onDelete={accountsHook.deleteAccount}
            theme={theme}
          />
        }
      />

      <div className="page-wrapper">
        <ErrorBoundary theme={theme}>
          <Suspense fallback={<TabFallback tab={activeTab} />}>

            {activeTab === "dashboard" && (
              <Dashboard
                stats={stats} equityCurve={equityCurve} monthlyPnl={monthlyPnl}
                marketBreakdown={marketBreakdown} settings={settings}
                currencyMeta={currencyMeta} theme={theme}
                onExportPdf={(month) => generatePdfReport(trades, stats, settings, currencyMeta, month || null)}
                pdfMonth={pdfMonth}
                onPdfMonthChange={setPdfMonth}
                trades={trades}
              />
            )}

            {activeTab === "journal" && (
              <Journal
                filteredTrades={filteredTrades} filterMarket={filterMarket}
                setFilterMarket={setFilterMarket} dateFrom={dateFrom} dateTo={dateTo}
                onFromChange={setDateFrom} onToChange={setDateTo}
                onClearDates={() => { setDateFrom(""); setDateTo(""); }}
                onAdd={openAddForm} onEdit={openEditForm}
                onDelete={handleDelete} onImport={handleImport} theme={theme}
                currencyMeta={currencyMeta}
              />
            )}

            {activeTab === "analytics" && (
              <Analytics
                trades={trades} stats={stats} strategyStats={strategyStats}
                marketBreakdown={marketBreakdown} emotionStats={emotionStats}
                currencyMeta={currencyMeta} theme={theme}
              />
            )}

            {activeTab === "calendar" && (
              <TradingCalendar trades={trades} currencyMeta={currencyMeta} theme={theme} />
            )}

            {activeTab === "insights" && (
              <Insights trades={trades} currencyMeta={currencyMeta} theme={theme} />
            )}

            {activeTab === "review" && (
              <Review trades={trades} currencyMeta={currencyMeta} theme={theme} />
            )}

            {activeTab === "playbook" && (
              <Playbook
                setups={playbookHook.setups}
                loading={playbookHook.loading}
                error={playbookHook.error}
                onAdd={playbookHook.addSetup}
                onUpdate={playbookHook.updateSetup}
                onDelete={playbookHook.deleteSetup}
                theme={theme}
              />
            )}

            {activeTab === "daily" && (
              <DailyJournal
                entries={dailyJournalHook.entries}
                loading={dailyJournalHook.loading}
                error={dailyJournalHook.error}
                onSave={dailyJournalHook.saveEntry}
                onDelete={dailyJournalHook.deleteEntry}
                theme={theme}
              />
            )}

            {activeTab === "replay" && (
              <TradeReplay trades={trades} currencyMeta={currencyMeta} theme={theme} />
            )}

            {activeTab === "share" && (
              <SharePerformance
                stats={stats} trades={trades} settings={settings}
                currencyMeta={currencyMeta} theme={theme}
              />
            )}

            {activeTab === "risk" && (
              <RiskCalculator settings={settings} currencyMeta={currencyMeta} theme={theme} />
            )}

            {activeTab === "settings" && (
              <Suspense fallback={<PageSkeleton />}>
                <Settings
                  settings={settings} onUpdate={updateSettings} onReset={resetSettings}
                  currencyMeta={currencyMeta} stats={stats} theme={theme}
                />
                <SettingsStatus
                  isConfigured={supabaseHook.isConfigured} syncing={supabaseHook.syncing}
                  syncError={supabaseHook.syncError} lastSynced={supabaseHook.lastSynced}
                  theme={theme}
                />
              </Suspense>
            )}

          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Trade Form Modal */}
      {showAddForm && (
        <TradeForm
          form={form} setForm={setForm} editingTrade={editingTrade}
          onSubmit={handleSubmit} onClose={closeForm} theme={theme}
          supabase={supabaseHook.supabase}
        />
      )}

      <NotificationsContainer toasts={toasts} onDismiss={dismissToast} theme={theme} />

      {/* Onboarding */}
      {onboarding.show && <Onboarding theme={theme} onDone={onboarding.done} />}
    </div>
  );
}