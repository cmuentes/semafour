package ai.kilocode.client.actions

import ai.kilocode.client.plugin.KiloBundle
import ai.kilocode.client.settings.profile.UserProfileConfigurable
import com.intellij.openapi.actionSystem.AnActionEvent

class OpenUserProfileSettingsAction : OpenSettingsPageAction(
    KiloBundle.message("action.Semafour.OpenUserProfileSettings.text"),
    KiloBundle.message("action.Semafour.OpenUserProfileSettings.description"),
    surface = "tool_window_profile",
) {
    internal override fun page(e: AnActionEvent): String = UserProfileConfigurable.ID
}
