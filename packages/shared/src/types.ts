// TypeScript types matching WIT definitions
// These provide type safety during development before WASM compilation

export type SentimentScore = 'positive' | 'neutral' | 'negative';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export type TicketStatus =
    | 'open'
    | 'in-progress'
    | 'waiting-response'
    | 'resolved'
    | 'closed';

export interface AnalysisResult {
    intent: string;
    sentiment: SentimentScore;
    urgency: UrgencyLevel;
    category: string;
}

export interface KnowledgeEntry {
    id: string;
    title: string;
    content: string;
    similarityScore: number;
}

export interface TicketData {
    id: string;
    title: string;
    description: string;
    customerEmail: string;
    createdAt: number;
    priority: string;
}

export interface Resolution {
    ticketId: string;
    status: TicketStatus;
    response: string;
    executionTimeMs: number;
}

export interface ObeliskError {
    code: string;
    message: string;
}

// Result type helper (matches WIT result<T, E>)
export type Result<T, E = ObeliskError> =
    | { ok: true; value: T }
    | { ok: false; error: E };

// Helper functions for Result type
export function Ok<T>(value: T): Result<T> {
    return { ok: true, value };
}

export function Err<E = ObeliskError>(error: E): Result<never, E> {
    return { ok: false, error };
}
