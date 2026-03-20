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
import { useAIAdvisor, buildAIContext } from "./hooks/useAIAdvisor";
import { usePortfolio }            from "./hooks/usePortfolio";
import { useEconomicCalendar }      from "./hooks/useEconomicCalendar";
import { useGamification }          from "./hooks/useGamification";
import { useStreak }                from "./hooks/useStreak";
import { useMarketScanner }         from "./hooks/useMarketScanner";
import { useDashboardLayout }       from "./hooks/useDashboardLayout";
import { useCurrency }              from "./hooks/useCurrency";
import { useRiskRules }             from "./hooks/useRiskRules";
import { useCustomAlerts }          from "./hooks/useCustomAlerts";
import { useGoalTracker }           from "./hooks/useGoalTracker";
import { useAdvancedFilter }        from "./hooks/useAdvancedFilter";
import { useTradingPlan }           from "./hooks/useTradingPlan";
import { useBacktest }              from "./hooks/useBacktest";
import { useBroker }                from "./hooks/useBroker";
import AIFloatingChat from "./components/AIFloatingChat";

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
const AIAdvisor         = lazy(() => import("./components/pages/AIAdvisor"));
const Portfolio         = lazy(() => import("./components/pages/Portfolio"));
const EconomicCalendar  = lazy(() => import("./components/pages/EconomicCalendar"));
const Gamification      = lazy(() => import("./components/pages/Gamification"));
const TradingPlan       = lazy(() => import("./components/pages/TradingPlan"));
const BacktestJournal   = lazy(() => import("./components/pages/BacktestJournal"));
const BrokerComparison     = lazy(() => import("./components/pages/BrokerComparison"));
const ScreenshotGallery   = lazy(() => import("./components/pages/ScreenshotGallery"));
const MarketScanner         = lazy(() => import("./components/pages/MarketScanner"));
const AdvancedFilterPanel   = lazy(() => import("./components/AdvancedFilterPanel"));
const HeatmapPage           = lazy(() => import("./components/pages/HeatmapPage"));
const CorrelationAnalysis   = lazy(() => import("./components/pages/CorrelationAnalysis"));
const TradeReplayModal      = lazy(() => import("./components/pages/TradeReplay"));

const TABS = ["dashboard", "journal", "analytics", "calendar", "insights", "review", "playbook", "daily", "replay", "share", "ai", "portfolio", "calendar-eco", "achievements", "plan", "backtest", "broker", "gallery", "scanner", "heatmap", "correlation", "risk", "settings"];

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

  const playbookHook     = usePlaybook();
  const dailyJournalHook = useDailyJournal();
  const aiHook           = useAIAdvisor();
  const portfolioHook    = usePortfolio(trades);
  const calendarHook     = useEconomicCalendar(trades);
  const gamificationHook = useGamification({ trades, stats, journalEntries: dailyJournalHook.entries, settings });
  const streakHook       = useStreak({ trades, journalEntries: dailyJournalHook.entries, settings });
  const scannerHook      = useMarketScanner(trades);
  const layoutHook       = useDashboardLayout();
  const currencyHook     = useCurrency(settings);
  const riskStatus       = useRiskRules(trades, settings);
  const alertsHook       = useCustomAlerts(trades, stats, settings);
  const goalHook         = useGoalTracker(trades, stats, settings);
  const filterHook       = useAdvancedFilter(trades);
  currencyMeta.rate     = currencyHook.rate;
  currencyMeta.convert  = currencyHook.convert;
  currencyMeta.formatFn = currencyHook.format;
  const planHook         = useTradingPlan(trades, stats, settings, currencyMeta);
  const backtestHook     = useBacktest(trades, playbookHook.setups);
  const brokerHook       = useBroker(trades);
  const { toasts, dismissToast, pushEnabled, enablePush } = useNotifications({
    stats, settings, currencyMeta,
    journalEntries: dailyJournalHook.entries,
    trades,
  });

  // ── Page title
  usePageTitle(activeTab);

  // Share trade handler — navigate to share tab
  function handleBulkTag(tradeId, updates) {
    tradeHook.updateTrade?.(tradeId, updates);
  }

  function handleUpdateCaptions(tradeId, captions) {
    tradeHook.updateTrade?.(tradeId, { screenshotCaptions: captions });
  }

  const [replayTrade, setReplayTrade] = useState(null);

  function handleReplay(trade) {
    setReplayTrade(trade);
    setActiveTab("replay");
  }

  function handleShareTrade(trade) {
    setActiveTab("share");
    // Store selected trade in sessionStorage for SharePerformance to pick up
    try { sessionStorage.setItem("tb_share_trade", JSON.stringify(trade)); } catch {}
  }

  // Build AI context — update saat data berubah
  const aiContext = buildAIContext({
    trades, stats, settings, currencyMeta,
    journal: dailyJournalHook.entries,
    playbook: playbookHook.setups,
  });
  aiHook.setContext(aiContext);

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

      {/* Risk lock banner */}
      {riskStatus.locked && (
        <div style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.3)", padding: "10px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>🚫</span>
          <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 500 }}>
            {riskStatus.warnings[0]?.msg || "Risk limit tercapai — trading diblokir hari ini"}
          </span>
        </div>
      )}
      {!riskStatus.locked && riskStatus.warnings.length > 0 && (
        <div style={{ background: "rgba(245,158,11,0.08)", borderBottom: "1px solid rgba(245,158,11,0.2)", padding: "10px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontSize: 12, color: "#f59e0b" }}>
            {riskStatus.warnings[0]?.msg}
          </span>
        </div>
      )}

      <div className="page-wrapper">
        <ErrorBoundary theme={theme}>
          <Suspense fallback={<TabFallback tab={activeTab} />}>
            <div key={activeTab} className="tab-content">

            {activeTab === "dashboard" && (
              <Dashboard
                gamificationHook={gamificationHook}
                streakHook={streakHook}
                layoutHook={layoutHook}
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 16, alignItems: "start" }}>
              <Journal
                filteredTrades={filterHook.filtered} filterMarket={filterHook.filter.market}
                setFilterMarket={v => filterHook.setField("market", v)}
                dateFrom={filterHook.filter.dateFrom} dateTo={filterHook.filter.dateTo}
                onFromChange={v => filterHook.setField("dateFrom", v)}
                onToChange={v => filterHook.setField("dateTo", v)}
                onClearDates={() => { filterHook.setField("dateFrom", ""); filterHook.setField("dateTo", ""); }}
                onAdd={openAddForm} onEdit={openEditForm}
                onDelete={handleDelete} onImport={handleImport} theme={theme}
                currencyMeta={currencyMeta}
                trades={trades} stats={stats} settings={settings}
                onShareTrade={handleShareTrade}
                onReplayTrade={handleReplayTrade}
                onReplay={handleReplay}
              />
              <Suspense fallback={null}>
                <AdvancedFilterPanel
                  filterHook={filterHook}
                  onBulkTag={handleBulkTag}
                  theme={theme}
                />
              </Suspense>
              </div>
            )}

            {activeTab === "analytics" && (
              <Analytics
                trades={trades} stats={stats} strategyStats={strategyStats}
                marketBreakdown={marketBreakdown} emotionStats={emotionStats}
                currencyMeta={currencyMeta} theme={theme}
                settings={settings}
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
                trades={trades}
                theme={theme}
              />
            )}

            {activeTab === "replay" && (
              <TradeReplay trades={trades} currencyMeta={currencyMeta} theme={theme} initialTrade={replayTrade} />
            )}

            {activeTab === "share" && (
              <SharePerformance
                stats={stats} trades={trades} settings={settings}
                currencyMeta={currencyMeta} theme={theme}
                gamificationHook={gamificationHook}
              />
            )}

            {activeTab === "ai" && (
              <AIAdvisor aiHook={aiHook} trades={trades} playbookSetups={playbookHook.setups} theme={theme} />
            )}

            {activeTab === "portfolio" && (
              <Portfolio
                portfolioHook={portfolioHook}
                settings={settings}
                currencyMeta={currencyMeta}
                theme={theme}
              />
            )}

            {activeTab === "calendar-eco" && (
              <EconomicCalendar calendarHook={calendarHook} theme={theme} />
            )}

            {activeTab === "achievements" && (
              <Gamification
                gamificationHook={gamificationHook}
                streakHook={streakHook}
                currencyMeta={currencyMeta}
                theme={theme}
              />
            )}

            {activeTab === "plan" && (
              <TradingPlan planHook={planHook} goalHook={goalHook} theme={theme} />
            )}

            {activeTab === "backtest" && (
              <BacktestJournal backtestHook={backtestHook} theme={theme} />
            )}

            {activeTab === "broker" && (
              <BrokerComparison brokerHook={brokerHook} theme={theme} />
            )}

            {activeTab === "correlation" && (
              <CorrelationAnalysis trades={trades} currencyMeta={currencyMeta} theme={theme} />
            )}

            {activeTab === "heatmap" && (
              <HeatmapPage trades={trades} currencyMeta={currencyMeta} theme={theme} />
            )}

            {activeTab === "scanner" && (
              <MarketScanner scannerHook={scannerHook} theme={theme} />
            )}

            {activeTab === "gallery" && (
              <ScreenshotGallery
                trades={trades}
                onOpenTrade={(trade) => { /* open detail modal */ }}
                theme={theme}
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
                  alertsHook={alertsHook} riskStatus={riskStatus}
                />
                <SettingsStatus
                  isConfigured={supabaseHook.isConfigured} syncing={supabaseHook.syncing}
                  syncError={supabaseHook.syncError} lastSynced={supabaseHook.lastSynced}
                  theme={theme}
                />
              </Suspense>
            )}

            </div>
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