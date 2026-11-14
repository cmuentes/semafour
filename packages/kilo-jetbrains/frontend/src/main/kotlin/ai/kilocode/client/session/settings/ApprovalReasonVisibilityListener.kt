package ai.kilocode.client.session.settings

import com.intellij.util.messages.Topic

fun interface ApprovalReasonVisibilityListener {
    fun changed(visible: Boolean)

    companion object {
        @JvmField
        val TOPIC: Topic<ApprovalReasonVisibilityListener> = Topic.create(
            "Semafour approval reason visibility",
            ApprovalReasonVisibilityListener::class.java,
        )
    }
}
