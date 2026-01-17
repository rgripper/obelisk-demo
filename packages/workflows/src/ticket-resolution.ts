// Ticket Resolution Workflow
// Deterministic orchestration logic for AI-assisted ticket resolution
// NO SIDE EFFECTS - only calls activities and makes routing decisions

import type {
    AnalysisResult,
    KnowledgeEntry,
    TicketStatus,
    Resolution,
    ObeliskError,
} from '@obelisk-demo/shared';

// Activity imports - these are imported via WIT at runtime
// The actual implementation is injected by Obelisk
declare function aiAnalyze(
    ticketText: string,
    idempotencyKey: string
): AnalysisResult | ObeliskError;

declare function kbSearch(
    query: string,
    maxResults: number,
    idempotencyKey: string
): KnowledgeEntry[] | ObeliskError;

declare function generateResponse(
    context: string,
    analysis: string,
    idempotencyKey: string
): string | ObeliskError;

declare function updateTicket(
    ticketId: string,
    status: TicketStatus,
    idempotencyKey: string
): void | ObeliskError;

declare function notifyTeam(
    message: string,
    channel: string,
    idempotencyKey: string
): void | ObeliskError;

/**
 * Main workflow: Process a support ticket with AI assistance
 * This function is deterministic and contains only orchestration logic
 *
 * @param ticketId - The ticket identifier
 * @param ticketText - The ticket description/content
 * @returns Resolution result or error
 */
export function processTicket(ticketId: string, ticketText: string): Resolution | ObeliskError {
    const startTime = Date.now();

    console.log(`[workflow] Processing ticket ${ticketId}`);

    // Step 1: Analyze the ticket using AI
    // Generate deterministic idempotency key based on ticket ID
    const analysisKey = `analyze-${ticketId}`;
    const analysisResult = aiAnalyze(ticketText, analysisKey);

    // Check if analysis failed
    if (isError(analysisResult)) {
        console.error('[workflow] Analysis failed:', analysisResult);
        return analysisResult;
    }

    const analysis = analysisResult as AnalysisResult;
    console.log(
        `[workflow] Analysis complete: ${analysis.category} (${analysis.urgency}), sentiment: ${analysis.sentiment}`
    );

    // Step 2: Route based on urgency and sentiment (deterministic logic)
    let resolution: Resolution;

    if (analysis.urgency === 'critical') {
        // Critical path: Notify team immediately and escalate
        console.log('[workflow] Critical ticket detected - notifying team');

        const notifyKey = `notify-critical-${ticketId}`;
        const notifyResult = notifyTeam(
            `URGENT: Ticket ${ticketId} requires immediate attention - ${analysis.category}`,
            'support-alerts',
            notifyKey
        );

        if (isError(notifyResult)) {
            console.error('[workflow] Notification failed:', notifyResult);
            // Continue anyway - notification failure shouldn't block workflow
        }

        // Update ticket to in-progress
        const updateKey1 = `update-progress-${ticketId}`;
        const updateResult = updateTicket(ticketId, 'in-progress', updateKey1);

        if (isError(updateResult)) {
            console.error('[workflow] Update failed:', updateResult);
            return updateResult;
        }

        // Search KB for context
        const searchKey = `search-${ticketId}`;
        const kbResult = kbSearch(analysis.intent, 3, searchKey);
        const kbEntries = isError(kbResult) ? [] : (kbResult as KnowledgeEntry[]);

        // Generate response
        const genKey = `generate-critical-${ticketId}`;
        const responseResult = generateResponse(
            kbEntries.length > 0 ? kbEntries[0]!.content : ticketText,
            JSON.stringify(analysis),
            genKey
        );

        const responseText = isError(responseResult)
            ? 'Your ticket is being reviewed by our team.'
            : (responseResult as string);

        resolution = {
            ticketId,
            status: 'in-progress',
            response: responseText,
            executionTimeMs: Date.now() - startTime,
        };
    } else if (analysis.sentiment === 'negative' || analysis.urgency === 'high') {
        // High priority path: Search KB and attempt resolution
        console.log('[workflow] High priority ticket - searching knowledge base');

        const searchKey = `search-${ticketId}`;
        const kbResult = kbSearch(analysis.intent, 5, searchKey);

        if (isError(kbResult)) {
            console.error('[workflow] KB search failed:', kbResult);
            // Escalate if KB search fails
            const notifyKey = `notify-escalate-${ticketId}`;
            notifyTeam(`Ticket ${ticketId} needs human review (KB search failed)`, 'support-team', notifyKey);

            const updateKey = `update-progress-${ticketId}`;
            updateTicket(ticketId, 'in-progress', updateKey);

            resolution = {
                ticketId,
                status: 'in-progress',
                response: 'Escalated to support team',
                executionTimeMs: Date.now() - startTime,
            };
        } else {
            const kbEntries = kbResult as KnowledgeEntry[];

            if (kbEntries.length > 0 && kbEntries[0]!.similarityScore > 0.8) {
                // High confidence match - auto-resolve
                console.log(
                    `[workflow] High confidence KB match found: ${kbEntries[0]!.title} (${kbEntries[0]!.similarityScore})`
                );

                const genKey = `generate-resolve-${ticketId}`;
                const responseResult = generateResponse(
                    kbEntries[0]!.content,
                    JSON.stringify(analysis),
                    genKey
                );

                const responseText = isError(responseResult)
                    ? kbEntries[0]!.content
                    : (responseResult as string);

                const updateKey = `update-resolved-${ticketId}`;
                updateTicket(ticketId, 'resolved', updateKey);

                resolution = {
                    ticketId,
                    status: 'resolved',
                    response: responseText,
                    executionTimeMs: Date.now() - startTime,
                };
            } else {
                // Low confidence - escalate to human
                console.log('[workflow] Low confidence match - escalating to human');

                const notifyKey = `notify-review-${ticketId}`;
                notifyTeam(`Ticket ${ticketId} needs human review - ${analysis.category}`, 'support-team', notifyKey);

                const updateKey = `update-progress-${ticketId}`;
                updateTicket(ticketId, 'in-progress', updateKey);

                resolution = {
                    ticketId,
                    status: 'in-progress',
                    response: 'Escalated to support team for personalized assistance',
                    executionTimeMs: Date.now() - startTime,
                };
            }
        }
    } else {
        // Normal priority path: Auto-resolve with KB
        console.log('[workflow] Normal priority ticket - attempting auto-resolution');

        const searchKey = `search-${ticketId}`;
        const kbResult = kbSearch(analysis.intent, 3, searchKey);
        const kbEntries = isError(kbResult) ? [] : (kbResult as KnowledgeEntry[]);

        const context = kbEntries.length > 0 ? kbEntries[0]!.content : ticketText;

        const genKey = `generate-auto-${ticketId}`;
        const responseResult = generateResponse(context, JSON.stringify(analysis), genKey);

        const responseText = isError(responseResult)
            ? 'Thank you for contacting support. We will respond within 24 hours.'
            : (responseResult as string);

        const updateKey = `update-resolved-${ticketId}`;
        updateTicket(ticketId, 'resolved', updateKey);

        resolution = {
            ticketId,
            status: 'resolved',
            response: responseText,
            executionTimeMs: Date.now() - startTime,
        };
    }

    console.log(
        `[workflow] Ticket ${ticketId} processed - status: ${resolution.status}, time: ${resolution.executionTimeMs}ms`
    );

    return resolution;
}

/**
 * Type guard to check if result is an error
 */
function isError(value: any): value is ObeliskError {
    return value !== null && typeof value === 'object' && 'code' in value && 'message' in value;
}

// Export for ComponentizeJS
export default { processTicket };
