import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  ExternalLink,
  Cpu,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const CACAO_URL = import.meta.env.VITE_CACAO_URL || "http://localhost:8001";

type ServiceStatus = "checking" | "up" | "down" | "degraded";

interface ServiceState {
  status: ServiceStatus;
  latency: number | null;
  message: string;
  checkedAt: Date | null;
}

interface ServiceConfig {
  id: string;
  name: string;
  description: string;
  url: string;
  checkUrl: string;
  icon: React.ReactNode;
}

const SERVICES: ServiceConfig[] = [
  {
    id: "bk-tmdt",
    name: "Main",
    description: "Hệ thống chính",
    url: API_URL,
    checkUrl: `${API_URL}/health`,
    icon: <Activity size={18} />,
  },
  {
    id: "bk-cacao",
    name: "Cacao",
    description: "AI Search & Recommendations",
    url: CACAO_URL,
    checkUrl: `${CACAO_URL}/`,
    icon: <Cpu size={18} />,
  },
  {
    id: "ollama",
    name: "Ollama Service",
    description: "LLM Cloud",
    url: CACAO_URL,
    checkUrl: `${CACAO_URL}/health/ollama`,
    icon: <Wifi size={18} />,
  },
];

async function checkService(
  checkUrl: string,
): Promise<{ status: ServiceStatus; latency: number; message: string }> {
  const start = performance.now();
  try {
    const res = await fetch(checkUrl, { signal: AbortSignal.timeout(10000) });
    const latency = Math.round(performance.now() - start);
    if (!res.ok) {
      return { status: "down", latency, message: `HTTP ${res.status}` };
    }
    const data = await res.json();
    if (data.status === "error") {
      return {
        status: "degraded",
        latency,
        message: data.message || `Code ${data.code}`,
      };
    }
    return {
      status: "up",
      latency,
      message: data.model ? `Model: ${data.model}` : "OK",
    };
  } catch (e: unknown) {
    const latency = Math.round(performance.now() - start);
    const msg = e instanceof Error ? e.message : "Network error";
    return { status: "down", latency, message: msg };
  }
}

const STATUS_STYLES: Record<
  ServiceStatus,
  { dot: string; badge: string; label: string }
> = {
  checking: {
    dot: "bg-amber-400 animate-pulse",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Đang kiểm tra",
  },
  up: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Hoạt động",
  },
  degraded: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Suy giảm",
  },
  down: {
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    label: "Ngừng hoạt động",
  },
};

function ServiceCard({
  config,
  state,
}: {
  config: ServiceConfig;
  state: ServiceState;
}) {
  const styles = STATUS_STYLES[state.status];

  return (
    <div
      className="rounded-2xl border border-[#FFC9D2]/40 bg-white/80 backdrop-blur-sm p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
      style={{ background: "rgba(255,255,255,0.85)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#F65C88]"
            style={{
              background: "linear-gradient(135deg, #FFF0F4 0%, #FFE4EC 100%)",
            }}
          >
            {config.icon}
          </div>
          <div>
            <h3 className="font-semibold text-[#040316] text-sm">
              {config.name}
            </h3>
            <p className="text-xs text-[#040316]/50 mt-0.5">
              {config.description}
            </p>
          </div>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${styles.badge}`}
        >
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${styles.dot}`}
          />
          {styles.label}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-[#040316]/40 pt-2 border-t border-[#FFC9D2]/20">
        <div className="flex items-center gap-1.5">
          <Clock size={11} />
          {state.checkedAt ? (
            <span>{state.checkedAt.toLocaleTimeString("vi-VN")}</span>
          ) : (
            <span>Chưa kiểm tra</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {state.latency !== null && (
            <span
              className={`font-mono font-medium ${state.latency < 300 ? "text-emerald-600" : state.latency < 800 ? "text-amber-600" : "text-rose-600"}`}
            >
              {state.latency}ms
            </span>
          )}
          {state.message && state.message !== "OK" && (
            <span className="truncate max-w-[140px]" title={state.message}>
              {state.message}
            </span>
          )}
          <a
            href={config.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#F65C88] hover:text-[#DB2E50] transition-colors"
            title={config.url}
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}

function OverallBanner({ states }: { states: Record<string, ServiceState> }) {
  const values = Object.values(states);
  const allUp = values.every((s) => s.status === "up");
  const anyDown = values.some((s) => s.status === "down");
  const checking = values.some((s) => s.status === "checking");

  if (checking) return null;

  if (allUp) {
    return (
      <div className="rounded-2xl px-6 py-4 flex items-center gap-3 text-emerald-800 bg-emerald-50 border border-emerald-200">
        <Wifi size={20} className="shrink-0" />
        <span className="font-medium text-sm">
          Tất cả dịch vụ đang hoạt động bình thường.
        </span>
      </div>
    );
  }
  if (anyDown) {
    return (
      <div className="rounded-2xl px-6 py-4 flex items-center gap-3 text-rose-800 bg-rose-50 border border-rose-200">
        <WifiOff size={20} className="shrink-0" />
        <span className="font-medium text-sm">
          Một số dịch vụ đang gặp sự cố.
        </span>
      </div>
    );
  }
  return (
    <div className="rounded-2xl px-6 py-4 flex items-center gap-3 text-amber-800 bg-amber-50 border border-amber-200">
      <Activity size={20} className="shrink-0" />
      <span className="font-medium text-sm">
        Một số dịch vụ hoạt động không ổn định.
      </span>
    </div>
  );
}

export default function StatusPage() {
  const [states, setStates] = useState<Record<string, ServiceState>>(() =>
    Object.fromEntries(
      SERVICES.map((s) => [
        s.id,
        {
          status: "checking" as ServiceStatus,
          latency: null,
          message: "",
          checkedAt: null,
        },
      ]),
    ),
  );
  const [refreshing, setRefreshing] = useState(false);

  const runChecks = useCallback(async () => {
    setRefreshing(true);
    setStates((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([id, s]) => [
          id,
          { ...s, status: "checking" as ServiceStatus },
        ]),
      ),
    );

    await Promise.all(
      SERVICES.map(async (svc) => {
        const result = await checkService(svc.checkUrl);
        setStates((prev) => ({
          ...prev,
          [svc.id]: { ...result, checkedAt: new Date() },
        }));
      }),
    );
    setRefreshing(false);
  }, []);

  useEffect(() => {
    runChecks();
    const interval = setInterval(runChecks, 30000);
    return () => clearInterval(interval);
  }, [runChecks]);

  return (
    <div className="min-h-screen" style={{ background: "#FBFBFE" }}>
      <div className="max-w-2xl mx-auto px-5 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#040316]">
              Trạng thái hệ thống
            </h1>
            <p className="text-sm text-[#040316]/50 mt-1">
              Tự động kiểm tra mỗi 30 giây
            </p>
          </div>
          <button
            onClick={runChecks}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #FF9FB1 0%, #DB2E50 100%)",
            }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Kiểm tra
          </button>
        </div>

        {/* Banner */}
        <div className="mb-6">
          <OverallBanner states={states} />
        </div>

        {/* Service cards */}
        <div className="flex flex-col gap-4">
          {SERVICES.map((svc) => (
            <ServiceCard key={svc.id} config={svc} state={states[svc.id]} />
          ))}
        </div>

        {/* URL config info */}
        <div className="mt-8 rounded-2xl border border-[#FFC9D2]/40 bg-white/60 p-5">
          <p className="text-xs font-semibold text-[#040316]/50 uppercase tracking-wider mb-3">
            Cấu hình hiện tại
          </p>
          <div className="flex flex-col gap-2">
            {[
              { label: "VITE_API_URL", value: API_URL },
              { label: "VITE_CACAO_URL", value: CACAO_URL },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-[#F65C88] bg-[#FFF0F4] px-2 py-0.5 rounded">
                  {label}
                </span>
                <span className="text-[#040316]/60 font-mono truncate">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
