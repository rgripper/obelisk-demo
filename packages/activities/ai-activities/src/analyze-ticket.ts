// AI Ticket Analysis Activity
// Extracts intent, sentiment, urgency from ticket text
// MUST BE IDEMPOTENT - same idempotency key always returns same result

import type { AnalysisResult, ObeliskError } from '@obelisk-demo/shared';

// In-memory cache for idempotency
// In production, use external store (Redis, DynamoDB, etc.)
const analysisCache = new Map<string, AnalysisResult>();

/**
 * Analyze ticket text using AI
 * @param ticketText - The ticket content to analyze
 * @param idempotencyKey - Unique key for idempotent execution
 * @returns Analysis result or error
 */
export async function analyze(
    ticketText: string,
    idempotencyKey: string
): Promise<AnalysisResult | ObeliskError> {
    // Idempotency check - return cached result if exists
    if (analysisCache.has(idempotencyKey)) {
        console.log(`[analyze-ticket] Cache hit for key: ${idempotencyKey}`);
        return analysisCache.get(idempotencyKey)!;
    }

    console.log(`[analyze-ticket] Processing new analysis for key: ${idempotencyKey}`);

    try {
        // In a real implementation, call OpenAI/Anthropic API
        // For demo purposes, we'll use simple heuristics
        const analysis = performSimpleAnalysis(ticketText);

        // Cache the result for idempotency
        analysisCache.set(idempotencyKey, analysis);

        return analysis;
    } catch (error) {
        console.error('[analyze-ticket] Error:', error);

        // Return default analysis on error (still idempotent)
        const defaultAnalysis: AnalysisResult = {
            intent: 'unknown',
            sentiment: 'neutral',
            urgency: 'medium',
            category: 'general',
        };

        analysisCache.set(idempotencyKey, defaultAnalysis);
        return defaultAnalysis;
    }
}

/**
 * Simple heuristic-based analysis for demo
 * In production, replace with actual AI API calls
 */
function performSimpleAnalysis(ticketText: string): AnalysisResult {
    const lowerText = ticketText.toLowerCase();

    // Determine sentiment
    let sentiment: AnalysisResult['sentiment'] = 'neutral';
    if (lowerText.includes('urgent') || lowerText.includes('critical') || lowerText.includes('broken')) {
        sentiment = 'negative';
    } else if (lowerText.includes('thank') || lowerText.includes('great') || lowerText.includes('excellent')) {
        sentiment = 'positive';
    }

    // Determine urgency
    let urgency: AnalysisResult['urgency'] = 'medium';
    if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('immediately')) {
        urgency = 'critical';
    } else if (lowerText.includes('important') || lowerText.includes('soon')) {
        urgency = 'high';
    } else if (lowerText.includes('when possible') || lowerText.includes('no rush')) {
        urgency = 'low';
    }

    // Determine category
    let category = 'general';
    if (lowerText.includes('login') || lowerText.includes('password') || lowerText.includes('access')) {
        category = 'authentication';
    } else if (lowerText.includes('payment') || lowerText.includes('billing') || lowerText.includes('invoice')) {
        category = 'billing';
    } else if (lowerText.includes('bug') || lowerText.includes('error') || lowerText.includes('crash')) {
        category = 'technical';
    } else if (lowerText.includes('feature') || lowerText.includes('request') || lowerText.includes('enhancement')) {
        category = 'feature-request';
    }

    // Extract intent (simplified)
    let intent = 'general-inquiry';
    if (lowerText.includes('reset password')) {
        intent = 'reset-password';
    } else if (lowerText.includes('refund')) {
        intent = 'request-refund';
    } else if (lowerText.includes('cancel')) {
        intent = 'cancel-subscription';
    } else if (lowerText.includes('how to') || lowerText.includes('how do i')) {
        intent = 'how-to-question';
    } else if (lowerText.includes('not working') || lowerText.includes('doesn\'t work')) {
        intent = 'report-issue';
    }

    return {
        intent,
        sentiment,
        urgency,
        category,
    };
}

// Export for ComponentizeJS
export default { analyze };
