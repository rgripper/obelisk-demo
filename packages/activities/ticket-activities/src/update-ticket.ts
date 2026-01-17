// Update Ticket Activity
// Updates ticket status in external ticketing system
// MUST BE IDEMPOTENT - same idempotency key prevents duplicate updates

import type { TicketStatus, ObeliskError } from '@obelisk-demo/shared';

// Track processed updates for idempotency
const processedUpdates = new Map<string, { ticketId: string; status: TicketStatus }>();

// Mock ticket status storage for demo
const ticketStatuses = new Map<string, TicketStatus>();

/**
 * Update ticket status (idempotent)
 * @param ticketId - The ticket ID to update
 * @param status - New status to set
 * @param idempotencyKey - Unique key for idempotent execution
 * @returns void or error
 */
export async function update(
    ticketId: string,
    status: TicketStatus,
    idempotencyKey: string
): Promise<void | ObeliskError> {
    // Idempotency check
    if (processedUpdates.has(idempotencyKey)) {
        const previous = processedUpdates.get(idempotencyKey)!;
        console.log(
            `[update-ticket] Idempotency key ${idempotencyKey} already processed: ${previous.ticketId} -> ${previous.status}`
        );

        // Verify the request matches the cached one
        if (previous.ticketId !== ticketId || previous.status !== status) {
            return {
                code: 'IDEMPOTENCY_MISMATCH',
                message: `Idempotency key ${idempotencyKey} was used with different parameters`,
            };
        }

        // Same request - return success
        return;
    }

    console.log(`[update-ticket] Updating ticket ${ticketId} to status: ${status}`);

    try {
        // In production, make API call to ticketing system
        // Ensure the API supports idempotency keys to prevent duplicate updates

        // For demo, update mock storage
        ticketStatuses.set(ticketId, status);

        // Record this update for idempotency
        processedUpdates.set(idempotencyKey, { ticketId, status });

        console.log(`[update-ticket] Successfully updated ${ticketId} to ${status}`);
    } catch (error) {
        console.error('[update-ticket] Error:', error);

        return {
            code: 'UPDATE_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error updating ticket',
        };
    }
}

/**
 * Helper to get current ticket status (for testing/debugging)
 */
export function getStatus(ticketId: string): TicketStatus | undefined {
    return ticketStatuses.get(ticketId);
}

// Export for ComponentizeJS
export default { update };
