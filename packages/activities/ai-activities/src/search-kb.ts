// Knowledge Base Search Activity
// Performs semantic search for similar resolved tickets
// MUST BE IDEMPOTENT - same idempotency key always returns same result

import type { KnowledgeEntry, ObeliskError } from '@obelisk-demo/shared';

// In-memory cache for idempotency
const searchCache = new Map<string, KnowledgeEntry[]>();

// Mock knowledge base for demo
const KNOWLEDGE_BASE: KnowledgeEntry[] = [
    {
        id: 'kb-001',
        title: 'How to reset your password',
        content: 'To reset your password, go to the login page and click "Forgot Password". Enter your email and follow the instructions sent to you.',
        similarityScore: 0,
    },
    {
        id: 'kb-002',
        title: 'Payment issues and refunds',
        content: 'If you\'re experiencing payment issues, please check your payment method is valid. For refunds, contact our billing team within 30 days of purchase.',
        similarityScore: 0,
    },
    {
        id: 'kb-003',
        title: 'Account access problems',
        content: 'If you cannot access your account, ensure you\'re using the correct email address. Try clearing your browser cache or use password reset.',
        similarityScore: 0,
    },
    {
        id: 'kb-004',
        title: 'Feature request process',
        content: 'We appreciate feature requests! Submit yours through our feedback form. Popular requests are prioritized in our roadmap.',
        similarityScore: 0,
    },
    {
        id: 'kb-005',
        title: 'Technical issues and bug reports',
        content: 'For technical issues, please provide: browser version, steps to reproduce, and screenshots. Our team will investigate within 24 hours.',
        similarityScore: 0,
    },
];

/**
 * Search knowledge base for relevant articles
 * @param query - Search query (usually the ticket intent or category)
 * @param maxResults - Maximum number of results to return
 * @param idempotencyKey - Unique key for idempotent execution
 * @returns List of knowledge entries or error
 */
export async function search(
    query: string,
    maxResults: number,
    idempotencyKey: string
): Promise<KnowledgeEntry[] | ObeliskError> {
    // Idempotency check
    if (searchCache.has(idempotencyKey)) {
        console.log(`[search-kb] Cache hit for key: ${idempotencyKey}`);
        return searchCache.get(idempotencyKey)!;
    }

    console.log(`[search-kb] Searching for: "${query}", max: ${maxResults}`);

    try {
        // In production, this would call a vector database or search API
        // For demo, use simple keyword matching with similarity scores
        const results = performSimpleSearch(query, maxResults);

        // Cache results for idempotency
        searchCache.set(idempotencyKey, results);

        return results;
    } catch (error) {
        console.error('[search-kb] Error:', error);

        // Return empty results on error (still idempotent)
        const emptyResults: KnowledgeEntry[] = [];
        searchCache.set(idempotencyKey, emptyResults);
        return emptyResults;
    }
}

/**
 * Simple keyword-based search for demo
 * In production, use vector embeddings and semantic search
 */
function performSimpleSearch(query: string, maxResults: number): KnowledgeEntry[] {
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/);

    // Score each KB entry based on keyword matches
    const scoredEntries = KNOWLEDGE_BASE.map((entry) => {
        const entryText = (entry.title + ' ' + entry.content).toLowerCase();
        let score = 0;

        // Calculate similarity based on matching words
        for (const word of queryWords) {
            if (word.length < 3) continue; // Skip short words

            if (entryText.includes(word)) {
                score += 0.3;
            }
        }

        // Boost if query substring matches title
        if (entry.title.toLowerCase().includes(lowerQuery)) {
            score += 0.5;
        }

        return {
            ...entry,
            similarityScore: Math.min(score, 1.0), // Cap at 1.0
        };
    });

    // Sort by score and return top results
    return scoredEntries
        .filter((entry) => entry.similarityScore > 0.1) // Minimum threshold
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, maxResults);
}

// Export for ComponentizeJS
export default { search };
