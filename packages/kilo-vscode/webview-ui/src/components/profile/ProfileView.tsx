import { Component, onMount } from "solid-js"
import { useVSCode } from "../../context/vscode"
import { useLanguage } from "../../context/language"
import type { ProviderUsageData } from "../../types/messages"
import { ProviderUsageCards } from "./ProviderUsageCards"

export interface ProfileViewProps {
  providerUsage?: ProviderUsageData
  providerUsageLoading?: boolean
  providerUsageError?: string
  onRequestProviderUsage?: () => void
  onRefreshProviderUsage?: () => void
}

const ProfileView: Component<ProfileViewProps> = (props) => {
  const vscode = useVSCode()
  const language = useLanguage()

  onMount(() => {
    props.onRequestProviderUsage?.()
  })

  const openExternal = (url: string) => {
    vscode.postMessage({ type: "openExternal", url })
  }

  return (
    <div style={{ display: "flex", "flex-direction": "column", height: "100%", "min-height": 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "12px 16px",
          "border-bottom": "1px solid var(--border-weak-base)",
          display: "flex",
          "align-items": "center",
          gap: "8px",
        }}
      >
        <h2 style={{ "font-size": "var(--kilo-font-size-16)", "font-weight": "600", margin: 0 }}>
          {language.t("profile.title")}
        </h2>
      </div>
      <div
        data-profile-scroll
        style={{
          flex: 1,
          "min-height": 0,
          "overflow-y": "auto",
          "overflow-x": "hidden",
          padding: "16px",
          "max-width": "480px",
          margin: "0 auto",
          width: "100%",
          "box-sizing": "border-box",
        }}
      >
        <ProviderUsageCards
          data={props.providerUsage}
          loading={props.providerUsageLoading ?? !props.providerUsage}
          error={props.providerUsageError}
          onRefresh={() => props.onRefreshProviderUsage?.()}
          onOpen={openExternal}
        />
      </div>
    </div>
  )
}

export default ProfileView
