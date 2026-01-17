# Quick Start Guide

Get up and running with the Obelisk workflow demo in minutes.

## Prerequisites

1. **Bun** (v1.0+): [Install Bun](https://bun.sh)
2. **Obelisk** (optional for full demo): [Install Obelisk](https://obeli.sk/docs/installation)

## Installation

```bash
# Clone or navigate to the repository
cd obelisk-demo

# Install all dependencies
bun install
```

## Build the Project

### Option 1: Build Everything

```bash
# Use the build script
./scripts/build-all.sh
```

### Option 2: Build Step-by-Step

```bash
# 1. Build shared types
bun run --cwd packages/shared build

# 2. Build workflows
bun run --cwd packages/workflows build

# 3. Build activities
bun run --cwd packages/activities/ai-activities build
bun run --cwd packages/activities/ticket-activities build
bun run --cwd packages/activities/notify-activities build
```

## What Gets Built?

After building, you'll have WebAssembly components:

```
packages/
├── workflows/dist/
│   └── ticket-resolution.wasm      # Main workflow
├── activities/ai-activities/dist/
│   ├── analyze-ticket.wasm         # AI analysis
│   ├── search-kb.wasm              # KB search
│   └── generate-response.wasm      # Response generation
├── activities/ticket-activities/dist/
│   ├── fetch-ticket.wasm           # Fetch ticket data
│   └── update-ticket.wasm          # Update ticket status
└── activities/notify-activities/dist/
    └── notify-team.wasm             # Team notifications
```

## Understanding the Code

### 1. Workflows (Deterministic Orchestration)

**File**: [packages/workflows/src/ticket-resolution.ts](packages/workflows/src/ticket-resolution.ts)

```typescript
export function processTicket(ticketId: string, ticketText: string): Resolution {
    // Step 1: Analyze ticket
    const analysis = aiAnalyze(ticketText, `analyze-${ticketId}`);

    // Step 2: Route based on urgency
    if (analysis.urgency === 'critical') {
        notifyTeam(`URGENT: ${ticketId}`, 'support-alerts', `notify-${ticketId}`);
        // ... handle critical path
    }

    return resolution;
}
```

**Key Points:**
- No side effects (no API calls, no DB access)
- Only orchestration logic
- Calls activities via imports
- Deterministic - same input always produces same output

### 2. Activities (Idempotent Side Effects)

**File**: [packages/activities/ai-activities/src/analyze-ticket.ts](packages/activities/ai-activities/src/analyze-ticket.ts)

```typescript
const cache = new Map<string, AnalysisResult>();

export async function analyze(ticketText: string, idempotencyKey: string) {
    // Idempotency check
    if (cache.has(idempotencyKey)) {
        return cache.get(idempotencyKey)!;
    }

    // Perform analysis
    const result = performAnalysis(ticketText);

    // Cache for future retries
    cache.set(idempotencyKey, result);
    return result;
}
```

**Key Points:**
- Can make external API calls
- Must be idempotent (same key = same result)
- Uses caching to ensure idempotency
- Safe to retry on failure

### 3. WIT Interfaces (Type-Safe Contracts)

**File**: [packages/wit/world.wit](packages/wit/world.wit)

```wit
world ticket-workflow {
    // Import activities
    import ai-analyze: func(ticket-text: string, idempotency-key: string)
        -> result<analysis-result, error>;

    // Export workflow function
    export process-ticket: func(ticket-id: string, ticket-text: string)
        -> result<resolution, error>;
}
```

**Key Points:**
- Defines component boundaries
- Type-safe interfaces between WASM components
- Similar to TypeScript interfaces but for WASM
- Auto-generates bindings

## Testing the Workflow Logic

Even without Obelisk installed, you can understand the workflow:

### Example: Critical Ticket

**Input:**
```json
{
  "ticketId": "TICKET-001",
  "ticketText": "Cannot reset password urgently!"
}
```

**Workflow Execution:**
1. **Analyze** → Detects "urgently" → urgency = 'critical'
2. **Route** → Critical path triggered
3. **Notify** → Sends alert to support-alerts channel
4. **Update** → Sets status to 'in-progress'
5. **Search KB** → Finds password reset article
6. **Generate** → Creates response with KB context
7. **Return** → Resolution with status and response

### Example: Normal Ticket

**Input:**
```json
{
  "ticketId": "TICKET-003",
  "ticketText": "Feature request: dark mode"
}
```

**Workflow Execution:**
1. **Analyze** → category = 'feature-request', urgency = 'low'
2. **Route** → Normal path triggered
3. **Search KB** → Finds feature request article
4. **Generate** → Creates acknowledgment response
5. **Update** → Sets status to 'resolved'
6. **Return** → Resolution with auto-response

## Running with Obelisk (Advanced)

If you have Obelisk installed:

```bash
# 1. Start Obelisk server
obelisk server --db sqlite://obelisk.db

# 2. Register workflow component
obelisk component add ticket-workflow \
    packages/workflows/dist/ticket-resolution.wasm

# 3. Register activity components
obelisk component add analyze-ticket \
    packages/activities/ai-activities/dist/analyze-ticket.wasm

obelisk component add search-kb \
    packages/activities/ai-activities/dist/search-kb.wasm

obelisk component add generate-response \
    packages/activities/ai-activities/dist/generate-response.wasm

obelisk component add update-ticket \
    packages/activities/ticket-activities/dist/update-ticket.wasm

obelisk component add notify-team \
    packages/activities/notify-activities/dist/notify-team.wasm

# 4. Execute workflow
obelisk workflow execute ticket-workflow process-ticket \
    --ticket-id "TEST-001" \
    --ticket-text "Cannot login to my account urgently!"

# 5. View execution logs
obelisk execution list
obelisk execution get <execution-id>
```

## Next Steps

1. **Modify the Workflow**
   - Edit [packages/workflows/src/ticket-resolution.ts](packages/workflows/src/ticket-resolution.ts)
   - Add new routing logic or conditions
   - Rebuild with `bun run build:workflows`

2. **Add New Activities**
   - Create new activity in `packages/activities/`
   - Define WIT interface in `packages/wit/activities/`
   - Implement idempotency pattern
   - Update workflow to import new activity

3. **Integrate Real AI**
   - Update [packages/activities/ai-activities/src/analyze-ticket.ts](packages/activities/ai-activities/src/analyze-ticket.ts)
   - Replace mock logic with OpenAI/Anthropic API calls
   - Ensure idempotency keys are passed to API

4. **Explore the Code**
   - Read through workflow logic to understand routing
   - Examine activity implementations for idempotency patterns
   - Study WIT files to understand component interfaces

## Troubleshooting

### Build Errors

```bash
# Clean and rebuild
./scripts/clean-all.sh
bun install
./scripts/build-all.sh
```

### TypeScript Errors

```bash
# Check types without building
bun run typecheck
```

### Understanding Errors

- **Workflow errors**: Check [packages/workflows/src/ticket-resolution.ts](packages/workflows/src/ticket-resolution.ts)
- **Activity errors**: Check individual activity files
- **WIT errors**: Validate WIT syntax in `.wit` files

## Learn More

- [README.md](README.md) - Full documentation
- [Obelisk Docs](https://obeli.sk/docs) - Workflow engine documentation
- [ComponentizeJS](https://github.com/bytecodealliance/ComponentizeJS) - TypeScript to WASM
- [WIT Specification](https://component-model.bytecodealliance.org/design/wit.html) - Interface types

## Questions?

- Check the [examples/](examples/) directory for sample data
- Review the [scripts/](scripts/) directory for build automation
- Read through the TypeScript source in [packages/](packages/)

Happy coding! 🚀
