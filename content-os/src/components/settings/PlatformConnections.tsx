"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Check,
  Unplug,
  ChevronDown,
  ChevronRight,
  Loader2,
  KeyRound,
} from "lucide-react";

interface ConnectedAccount {
  id: string;
  platform: string;
  account_name: string | null;
  account_id: string | null;
  connected_at: string;
  connection_method?: string | null;
}

interface PlatformConnectionsProps {
  connectedAccounts: ConnectedAccount[];
  onConnect: (platform: string) => void;
  onDisconnect: (platform: string) => void;
  disconnecting: string | null;
  onAccountsRefresh: () => void;
}

const PLATFORM_META: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  instagram: { label: "Instagram", color: "#E4405F", icon: "IG" },
  linkedin: { label: "LinkedIn", color: "#0A66C2", icon: "in" },
  twitter: { label: "X / Twitter", color: "#E7E5E4", icon: "\u{1D54F}" },
  threads: { label: "Threads", color: "#E7E5E4", icon: "@" },
};

const BYOK_FIELDS: Record<string, [string, string][]> = {
  twitter: [
    ["api_key", "API Key"],
    ["api_secret", "API Secret"],
    ["access_token", "Access Token"],
    ["access_token_secret", "Access Token Secret"],
  ],
  linkedin: [["access_token", "Access Token"]],
  instagram: [["access_token", "Access Token"]],
  threads: [["access_token", "Access Token"]],
};

type ByokState = Record<string, Record<string, string>>;

export default function PlatformConnections({
  connectedAccounts,
  onConnect,
  onDisconnect,
  disconnecting,
  onAccountsRefresh,
}: PlatformConnectionsProps) {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [byokValues, setByokValues] = useState<ByokState>({});
  const [savingPlatform, setSavingPlatform] = useState<string | null>(null);
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { valid: boolean; message: string } | null>>({});
  const [saveError, setSaveError] = useState<Record<string, string | null>>({});

  function getConnectionStatus(platform: string): "oauth" | "byok" | "none" {
    const account = connectedAccounts.find((a) => a.platform === platform);
    if (!account) return "none";
    if (account.connection_method === "byok") return "byok";
    return "oauth";
  }

  function updateByokField(platform: string, field: string, value: string) {
    setByokValues((prev) => ({
      ...prev,
      [platform]: { ...(prev[platform] ?? {}), [field]: value },
    }));
  }

  async function handleSaveKeys(platform: string) {
    const creds = byokValues[platform] ?? {};
    const fields = BYOK_FIELDS[platform] ?? [];
    const missing = fields.filter(([key]) => !creds[key]?.trim());
    if (missing.length > 0) {
      setSaveError((prev) => ({
        ...prev,
        [platform]: `Missing: ${missing.map(([, label]) => label).join(", ")}`,
      }));
      return;
    }

    setSavingPlatform(platform);
    setSaveError((prev) => ({ ...prev, [platform]: null }));

    try {
      const res = await fetch("/api/social-accounts/byok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, credentials: creds }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Save failed" }));
        setSaveError((prev) => ({ ...prev, [platform]: data.error ?? "Save failed" }));
      } else {
        setSaveError((prev) => ({ ...prev, [platform]: null }));
        setByokValues((prev) => ({ ...prev, [platform]: {} }));
        onAccountsRefresh();
      }
    } catch {
      setSaveError((prev) => ({ ...prev, [platform]: "Network error" }));
    } finally {
      setSavingPlatform(null);
    }
  }

  async function handleTestConnection(platform: string) {
    const creds = byokValues[platform] ?? {};
    const fields = BYOK_FIELDS[platform] ?? [];
    const missing = fields.filter(([key]) => !creds[key]?.trim());
    if (missing.length > 0) {
      setTestResult((prev) => ({
        ...prev,
        [platform]: { valid: false, message: `Missing: ${missing.map(([, label]) => label).join(", ")}` },
      }));
      return;
    }

    setTestingPlatform(platform);
    setTestResult((prev) => ({ ...prev, [platform]: null }));

    try {
      const res = await fetch("/api/social-accounts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, credentials: creds }),
      });

      const data = await res.json().catch(() => ({ valid: false, error: "Test failed" }));
      if (data.valid) {
        const name = data.profile?.name ?? "";
        const username = data.profile?.username ?? "";
        setTestResult((prev) => ({
          ...prev,
          [platform]: { valid: true, message: `Connected as ${name} (@${username})` },
        }));
      } else {
        setTestResult((prev) => ({
          ...prev,
          [platform]: { valid: false, message: data.error ?? "Invalid credentials" },
        }));
      }
    } catch {
      setTestResult((prev) => ({
        ...prev,
        [platform]: { valid: false, message: "Network error" },
      }));
    } finally {
      setTestingPlatform(null);
    }
  }

  return (
    <>
      <p className="text-sm text-[#71717A] mb-4">
        Connect accounts via OAuth or enter API keys manually.
      </p>
      <div className="space-y-3">
        {(["twitter", "linkedin", "instagram", "threads"] as const).map(
          (platform) => {
            const account = connectedAccounts.find(
              (a) => a.platform === platform
            );
            const status = getConnectionStatus(platform);
            const isDisconnecting = disconnecting === platform;
            const isExpanded = expandedPlatform === platform;
            const meta = PLATFORM_META[platform];

            return (
              <div
                key={platform}
                className="border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] overflow-hidden"
              >
                {/* Card header */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedPlatform(isExpanded ? null : platform)
                  }
                  className="w-full flex items-center justify-between py-3 px-4 bg-[#18181B] hover:bg-[#27272A] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-7 h-7 rounded-[5px] flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.icon}
                    </span>
                    <span className="text-[13px] font-medium text-[#FAFAFA]">
                      {meta.label}
                    </span>
                    <ConnectionBadge status={status} />
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-[#71717A]" />
                  ) : (
                    <ChevronRight size={16} className="text-[#71717A]" />
                  )}
                </button>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="p-4 space-y-4 border-t-[0.5px] border-[#FAFAFA]/12">
                    {/* OAuth section */}
                    <div>
                      <span className="text-[10px] font-medium tracking-[0.10em] uppercase text-[#71717A] block mb-2">
                        OAUTH CONNECTION
                      </span>
                      {status === "oauth" && account ? (
                        <div className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-2">
                            <Check size={14} className="text-[#3B6D11]" />
                            <span className="text-[12px] text-[#3B6D11]">
                              Connected
                              {account.account_name
                                ? ` as ${account.account_name}`
                                : ""}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={isDisconnecting}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDisconnect(platform);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-[#A1A1AA] border-[0.5px] border-[#FAFAFA]/12 rounded-[6px] hover:border-[#FAFAFA]/25 transition-colors disabled:opacity-60"
                          >
                            <Unplug size={12} />
                            {isDisconnecting ? "..." : "Disconnect"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onConnect(platform)}
                          className="px-4 py-2 text-[12px] text-white bg-[#6366F1] rounded-[7px] hover:bg-[#6366F1]/90 transition-colors"
                        >
                          Connect with {meta.label}
                        </button>
                      )}
                    </div>

                    {/* BYOK section */}
                    <ByokSection
                      platform={platform}
                      byokValues={byokValues[platform] ?? {}}
                      onFieldChange={(field, value) =>
                        updateByokField(platform, field, value)
                      }
                      onSaveKeys={() => handleSaveKeys(platform)}
                      onTestConnection={() => handleTestConnection(platform)}
                      saving={savingPlatform === platform}
                      testing={testingPlatform === platform}
                      testResult={testResult[platform] ?? null}
                      saveError={saveError[platform] ?? null}
                      isByokConnected={status === "byok"}
                    />
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ConnectionBadge({ status }: { status: "oauth" | "byok" | "none" }) {
  if (status === "oauth") {
    return (
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-[3px] bg-[rgba(16,185,129,0.15)] text-[#10B981]">
        OAuth
      </span>
    );
  }
  if (status === "byok") {
    return (
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-[3px] bg-[rgba(139,92,246,0.15)] text-[#8B5CF6]">
        Manual Keys
      </span>
    );
  }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-[3px] bg-[#27272A] text-[#71717A]">
      Not configured
    </span>
  );
}

function ByokSection({
  platform,
  byokValues,
  onFieldChange,
  onSaveKeys,
  onTestConnection,
  saving,
  testing,
  testResult,
  saveError,
  isByokConnected,
}: {
  platform: string;
  byokValues: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
  onSaveKeys: () => void;
  onTestConnection: () => void;
  saving: boolean;
  testing: boolean;
  testResult: { valid: boolean; message: string } | null;
  saveError: string | null;
  isByokConnected: boolean;
}) {
  const fields = BYOK_FIELDS[platform] ?? [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <KeyRound size={12} className="text-[#71717A]" />
        <span className="text-[10px] font-medium tracking-[0.10em] uppercase text-[#71717A]">
          USE API KEYS
        </span>
      </div>
      <p className="text-[11px] text-[#71717A] mb-3">
        Enter your own API credentials as a fallback to OAuth.
      </p>

      {isByokConnected && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[rgba(139,92,246,0.1)] rounded-[7px]">
          <Check size={14} className="text-[#8B5CF6]" />
          <span className="text-[12px] text-[#8B5CF6]">
            Manual keys configured
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map(([field, label]) => (
          <PasswordField
            key={field}
            label={label}
            value={byokValues[field] ?? ""}
            onChange={(v) => onFieldChange(field, v)}
          />
        ))}
      </div>

      {/* Save error */}
      {saveError && (
        <p className="text-[11px] text-red-400 mt-2">{saveError}</p>
      )}

      {/* Test result */}
      {testResult && (
        <p
          className={`text-[11px] mt-2 ${
            testResult.valid ? "text-[#10B981]" : "text-red-400"
          }`}
        >
          {testResult.message}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-3">
        <button
          type="button"
          disabled={saving}
          onClick={onSaveKeys}
          className="px-4 py-2 text-[12px] text-white bg-[#6366F1] rounded-[7px] hover:bg-[#6366F1]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && <Loader2 size={12} className="animate-spin" />}
          {saving ? "Saving..." : "Save Keys"}
        </button>
        <button
          type="button"
          disabled={testing}
          onClick={onTestConnection}
          className="px-4 py-2 text-[12px] text-[#FAFAFA] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] hover:border-[#FAFAFA]/25 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {testing && <Loader2 size={12} className="animate-spin" />}
          {testing ? "Testing..." : "Test Connection"}
        </button>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="block text-xs text-[#71717A] mb-1">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          className="w-full bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-3 py-2 pr-10 text-sm font-mono text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none focus:border-[#FAFAFA]/40 transition-colors"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA] transition-colors"
          aria-label={visible ? "Hide" : "Show"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
