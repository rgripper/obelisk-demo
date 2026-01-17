// Fetch Ticket Activity
// Retrieves ticket data from external ticketing system
// Read-only operation but should still handle errors gracefully

import type { TicketData, ObeliskError } from '@obelisk-demo/shared';

// Mock ticket database for demo
const MOCK_TICKETS: Record<string, TicketData> = {
    'TICKET-001': {
        id: 'TICKET-001',
        title: 'Cannot reset password',
        description:
            'I\'ve been trying to reset my password for the past hour but I\'m not receiving the reset email. This is urgent as I need to access my account for an important meeting.',
        customerEmail: 'user@example.com',
        createdAt: Date.now() - 3600000, // 1 hour ago
        priority: 'high',
    },
    'TICKET-002': {
        id: 'TICKET-002',
        title: 'Billing question about invoice',
        description:
            'I received an invoice for $99 but I thought my subscription was $49/month. Can you please clarify this charge?',
        customerEmail: 'customer@example.com',
        createdAt: Date.now() - 7200000, // 2 hours ago
        priority: 'medium',
    },
    'TICKET-003': {
        id: 'TICKET-003',
        title: 'Feature request: Dark mode',
        description:
            'Would love to see a dark mode option in the app. Many of us work late hours and it would be easier on the eyes.',
        customerEmail: 'feedback@example.com',
        createdAt: Date.now() - 86400000, // 1 day ago
        priority: 'low',
    },
};

/**
 * Fetch ticket data from external system
 * @param ticketId - The ticket ID to fetch
 * @returns Ticket data or error
 */
export async function fetch(ticketId: string): Promise<TicketData | ObeliskError> {
    console.log(`[fetch-ticket] Fetching ticket: ${ticketId}`);

    try {
        // In production, this would make an API call to the ticketing system
        // For demo, use mock data
        const ticket = MOCK_TICKETS[ticketId];

        if (!ticket) {
            return {
                code: 'TICKET_NOT_FOUND',
                message: `Ticket ${ticketId} not found in the system`,
            };
        }

        console.log(`[fetch-ticket] Found ticket: ${ticket.title}`);
        return ticket;
    } catch (error) {
        console.error('[fetch-ticket] Error:', error);

        return {
            code: 'FETCH_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error fetching ticket',
        };
    }
}

// Export for ComponentizeJS
export default { fetch };
