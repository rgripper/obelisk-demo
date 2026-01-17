// AI Response Generation Activity
// Creates draft responses based on ticket context and analysis
// MUST BE IDEMPOTENT - same idempotency key always returns same result

import type { ObeliskError } from '@obelisk-demo/shared';

// In-memory cache for idempotency
const responseCache = new Map<string, string>();

/**
 * Generate response using AI
 * @param context - Ticket context (usually KB article or ticket text)
 * @param analysis - JSON string of analysis result
 * @param idempotencyKey - Unique key for idempotent execution
 * @returns Generated response or error
 */
export async function generate(
    context: string,
    analysis: string,
    idempotencyKey: string
): Promise<string | ObeliskError> {
    // Idempotency check
    if (responseCache.has(idempotencyKey)) {
        console.log(`[generate-response] Cache hit for key: ${idempotencyKey}`);
        return responseCache.get(idempotencyKey)!;
    }

    console.log(`[generate-response] Generating response for key: ${idempotencyKey}`);

    try {
        // In production, call OpenAI/Anthropic API
        // For demo, use template-based generation
        const response = generateTemplateResponse(context, analysis);

        // Cache response for idempotency
        responseCache.set(idempotencyKey, response);

        return response;
    } catch (error) {
        console.error('[generate-response] Error:', error);

        // Return default response on error (still idempotent)
        const defaultResponse =
            'Thank you for contacting support. We have received your ticket and will respond within 24 hours.';

        responseCache.set(idempotencyKey, defaultResponse);
        return defaultResponse;
    }
}

/**
 * Template-based response generation for demo
 * In production, replace with actual AI generation
 */
function generateTemplateResponse(context: string, analysisJson: string): string {
    try {
        const analysis = JSON.parse(analysisJson);

        // Build response based on analysis
        let response = 'Thank you for reaching out to our support team.\n\n';

        // Add urgency acknowledgment
        if (analysis.urgency === 'critical' || analysis.urgency === 'high') {
            response += 'We understand this is urgent and we\'re prioritizing your request.\n\n';
        }

        // Add category-specific response
        switch (analysis.category) {
            case 'authentication':
                response += 'For account access issues, please try the following:\n';
                response += '1. Use the "Forgot Password" link on the login page\n';
                response += '2. Check your email for the reset link\n';
                response += '3. If you don\'t receive the email, check your spam folder\n\n';
                break;

            case 'billing':
                response += 'For billing inquiries, our billing team will review your request.\n';
                response += 'Please allow 1-2 business days for a detailed response.\n\n';
                break;

            case 'technical':
                response += 'We\'ve received your technical issue report.\n';
                response += 'Our engineering team will investigate and respond within 24 hours.\n\n';
                break;

            case 'feature-request':
                response += 'Thank you for your feature suggestion!\n';
                response += 'We\'ve added it to our product roadmap for consideration.\n\n';
                break;

            default:
                response += 'We\'ve reviewed your inquiry and will provide a detailed response soon.\n\n';
        }

        // Add context if available
        if (context && context.length > 20) {
            response += 'In the meantime, you may find this information helpful:\n\n';
            response += context.substring(0, 300); // Limit context length
            response += '\n\n';
        }

        // Add closing
        response += 'If you have any additional questions, please don\'t hesitate to reach out.\n\n';
        response += 'Best regards,\n';
        response += 'Support Team';

        return response;
    } catch (error) {
        // If analysis parsing fails, return generic response
        return 'Thank you for contacting support. We have received your ticket and will respond within 24 hours.';
    }
}

// Export for ComponentizeJS
export default { generate };
