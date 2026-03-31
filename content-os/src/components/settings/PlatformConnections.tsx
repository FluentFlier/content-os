"use client";

import { useState } from "react";
import { Eye, EyeOff, Check, Unplug, ChevronDown, ChevronRight } from "lucide-react";
import type { PlatformConfig } from "@/types/database";

interface ConnectedAccount {
  id: string;
  platform: string;
  account_name: string | null;
  account_id: string | null;
  connected_at: string;
}

interface PlatformConnectionsProps {
  platformConfig: PlatformConfig;
  onPlatformConfigChange: (config: PlatformConfig) => void;
  connectedAccounts: ConnectedAccount[];
  onConnect: (platform: string) => void;
  onDisconnect: (platform: string) => void;
  disconnecting: string | null;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
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

export default function PlatformConnections({
  platformConfig,
  onPlatformConfigChange,
  connectedAccounts,
  onConnect,
  onDisconnect,
  disconnecting,
  onSave,
  saving,
  saved,
}: PlatformConnectionsProps) {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  const getManualConfigured = (platform: string): boolean => {
    if (platform === "twitter") {
      const c = platformConfig.x;
      return !!(c?.apiKey && c?.accessToken && c?.enabled);
    }
    if (platform === "linkedin") {
      const c = platformConfig.linkedin;
      return !!(c?.accessToken && c?.enabled);
    }
    if (platform === "instagram") {
      const c = platformConfig.instagram;
      return !!(c?.accessToken && c?.enabled);
    }
    if (platform === "threads") {
      const c = platformConfig.threads;
      return !!(c?.accessToken && c?.enabled);
    }
    return false;
  };

  const getEnabled = (platform: string): boolean => {
    if (platform === "twitter") return platformConfig.x?.enabled ?? false;
    if (platform === "linkedin") return platformConfig.linkedin?.enabled ?? false;
    if (platform === "instagram") return platformConfig.instagram?.enabled ?? false;
    return platformConfig.threads?.enabled ?? false;
  };

  const setEnabled = (platform: string, v: boolean) => {
    if (platform === "twitter") {
      onPlatformConfigChange({
        ...platformConfig,
        x: { ...platformConfig.x!, enabled: v },
      });
    } else if (platform === "linkedin") {
      onPlatformConfigChange({
        ...platformConfig,
        linkedin: { ...platformConfig.linkedin!, enabled: v },
      });
    } else if (platform === "instagram") {
      onPlatformConfigChange({
        ...platformConfig,
        instagram: { ...platformConfig.instagram!, enabled: v },
      });
    } else {
      onPlatformConfigChange({
        ...platformConfig,
        threads: { ...platformConfig.threads!, enabled: v },
      });
    }
  };

  const updateField = (platform: string, field: string, value: string) => {
    const configKey = platform === "twitter" ? "x" : platform;
    onPlatformConfigChange({
      ...platformConfig,
      [configKey]: {
        ...(platformConfig as Record<string, unknown>)[configKey] as Record<string, unknown>,
        [field]: value,
      },
    });
  };

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
            const isOAuthConnected = !!account;
            const isDisconnecting = disconnecting === platform;
            const isExpanded = expandedPlatform === platform;
            const meta = PLATFORM_META[platform];
            const hasManualKeys = getManualConfigured(platform);

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
                    {isOAuthConnected && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-[3px] bg-[rgba(16,185,129,0.15)] text-[#3B6D11]">
                        OAuth
                      </span>
                    )}
                    {hasManualKeys && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-[3px] bg-[#E8E5FF] text-[#6B5CE7]">
                        Manual Keys
                      </span>
                    )}
                    {!isOAuthConnected && !hasManualKeys && (
                      <span className="text-[10px] px-2 py-0.5 rounded-[3px] bg-[#18181B] text-[#71717A]">
                        Not configured
                      </span>
                    )}
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
                      {isOAuthConnected ? (
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

                    {/* Manual keys section */}
                    <div>
                      <span className="text-[10px] font-medium tracking-[0.10em] uppercase text-[#71717A] block mb-2">
                        MANUAL API KEYS
                      </span>
                      <p className="text-[11px] text-[#71717A] mb-3">
                        Enter your own API credentials as a fallback to OAuth.
                      </p>

                      <ManualKeyFields
                        platform={platform}
                        platformConfig={platformConfig}
                        onFieldChange={updateField}
                      />

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[12px] text-[#FAFAFA]">
                          Enable manual keys
                        </span>
                        <Toggle
                          enabled={getEnabled(platform)}
                          onChange={(v) => setEnabled(platform, v)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>

      <div className="mt-4">
        <SaveButton onClick={onSave} loading={saving} saved={saved} label="Save API Keys" />
      </div>
    </>
  );
}

/* Sub-components */

function ManualKeyFields({
  platform,
  platformConfig,
  onFieldChange,
}: {
  platform: string;
  platformConfig: PlatformConfig;
  onFieldChange: (platform: string, field: string, value: string) => void;
}) {
  const fieldSets: Record<string, [string, string][]> = {
    twitter: [
      ["apiKey", "API Key"],
      ["apiSecret", "API Secret"],
      ["accessToken", "Access Token"],
      ["accessSecret", "Access Secret"],
    ],
    linkedin: [
      ["accessToken", "Access Token"],
      ["refreshToken", "Refresh Token"],
    ],
    instagram: [
      ["accessToken", "Access Token"],
      ["igUserId", "Instagram User ID"],
    ],
    threads: [
      ["accessToken", "Access Token"],
      ["threadsUserId", "Threads User ID"],
    ],
  };

  const fields = fieldSets[platform] ?? [];
  const configKey = platform === "twitter" ? "x" : platform;
  const config = (platformConfig as Record<string, unknown>)[configKey] as
    | Record<string, string>
    | undefined;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map(([field, label]) => (
        <PasswordField
          key={field}
          label={label}
          value={config?.[field] ?? ""}
          onChange={(v) => onFieldChange(platform, field, v)}
        />
      ))}
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
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-[#6366F1]" : "bg-[#27272A]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SaveButton({
  onClick,
  loading,
  saved,
  label = "Save",
}: {
  onClick: () => void;
  loading: boolean;
  saved: boolean;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={onClick}
        className="px-5 py-2 rounded-lg bg-[#6366F1] text-white font-medium text-sm hover:bg-[#6366F1]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Saving..." : label}
      </button>
      {saved && (
        <span className="text-sm text-[#3B6D11] animate-fade-in">Saved!</span>
      )}
    </div>
  );
}
