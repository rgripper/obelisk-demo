// Team Notification Activity
// Sends notifications to Slack/Teams/Email
// MUST BE IDEMPOTENT - prevents duplicate notifications

import type { ObeliskError } from '@obelisk-demo/shared';

// Track sent notifications for idempotency
const sentNotifications = new Map<
    string,
    { message: string; channel: string; timestamp: number }
>();

/**
 * Send notification to team (idempotent)
 * @param message - Notification message
 * @param channel - Channel/destination (e.g., 'support-alerts', 'support-team')
 * @param idempotencyKey - Unique key for idempotent execution
 * @returns void or error
 */
export async function notify(
    message: string,
    channel: string,
    idempotencyKey: string
): Promise<void | ObeliskError> {
    // Idempotency check
    if (sentNotifications.has(idempotencyKey)) {
        const previous = sentNotifications.get(idempotencyKey)!;
        console.log(
            `[notify-team] Notification already sent for key ${idempotencyKey} at ${new Date(previous.timestamp).toISOString()}`
        );

        // Verify the request matches the cached one
        if (previous.message !== message || previous.channel !== channel) {
            return {
                code: 'IDEMPOTENCY_MISMATCH',
                message: `Idempotency key ${idempotencyKey} was used with different parameters`,
            };
        }

        // Same request - return success without sending again
        return;
    }

    console.log(`[notify-team] Sending notification to ${channel}: ${message.substring(0, 50)}...`);

    try {
        // In production, integrate with actual notification services:
        // - Slack: Use Slack Web API with incoming webhooks
        // - Teams: Use Microsoft Teams connectors
        // - Email: Use SendGrid, AWS SES, etc.
        // - PagerDuty: For critical alerts

        // For demo, just log the notification
        const notification = {
            message,
            channel,
            timestamp: Date.now(),
        };

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Record notification for idempotency
        sentNotifications.set(idempotencyKey, notification);

        console.log(
            `[notify-team] Successfully sent notification to ${channel} (key: ${idempotencyKey})`
        );

        // In production with Slack, you might do:
        // await fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     channel: `#${channel}`,
        //     text: message,
        //     // Include idempotency key in metadata if supported
        //   }),
        // });
    } catch (error) {
        console.error('[notify-team] Error:', error);

        return {
            code: 'NOTIFICATION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error sending notification',
        };
    }
}

/**
 * Helper to check if notification was sent (for testing/debugging)
 */
export function wasSent(idempotencyKey: string): boolean {
    return sentNotifications.has(idempotencyKey);
}

// Export for ComponentizeJS
export default { notify };
