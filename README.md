# Obelisk Workflow Engine Demo

A TypeScript monorepo demonstrating the **Obelisk workflow engine** with an **AI-assisted customer support ticket resolution** workflow. This project showcases how to build deterministic workflows that compile to WebAssembly components.

## What is This?

This demo implements an intelligent ticket routing system using:
- **Obelisk**: Deterministic workflow engine with complete reproducibility
- **TypeScript**: Compiled to WebAssembly using ComponentizeJS
- **WIT (WebAssembly Interface Types)**: Type-safe component boundaries
- **Bun**: Fast package manager and build tool

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Workflow (Deterministic)              │
│  • Ticket routing logic                                 │
│  • Priority-based decisions                             │
│  • No side effects                                      │
└────────────┬────────────────────────────────────────────┘
             │ calls via WIT
             ▼
┌─────────────────────────────────────────────────────────┐
│              Activities (Idempotent Side Effects)        │
├─────────────────────┬───────────────┬───────────────────┤
│  AI Activities      │ Ticket Ops    │ Notifications     │
│  • Analyze ticket   │ • Fetch data  │ • Slack/Email     │
│  • Search KB        │ • Update DB   │ • Alerts          │
│  • Generate reply   │               │                   │
└─────────────────────┴───────────────┴───────────────────┘
```

## Project Structure

```
obelisk-demo/
├── packages/
│   ├── wit/                    # WIT interface definitions
│   │   ├── world.wit          # Main workflow world
│   │   └── activities/        # Activity interfaces
│   ├── workflows/             # Deterministic orchestration
│   │   └── src/ticket-resolution.ts
│   ├── activities/
│   │   ├── ai-activities/     # AI integration (analyze, search, generate)
│   │   ├── ticket-activities/ # Ticket system operations
│   │   └── notify-activities/ # Team notifications
│   └── shared/                # Common TypeScript types
├── scripts/                   # Build automation
└── examples/                  # Sample tickets
```

## Key Concepts

### Workflows (Deterministic)
- **Pure orchestration logic** - no side effects
- Calls activities and makes routing decisions
- Always reproducible from execution log
- Compiled to `wasm32-unknown-unknown`

### Activities (Idempotent)
- **All external interactions** (API calls, DB queries)
- Must be **idempotent** - safe to retry multiple times
- Use idempotency keys to cache results
- Compiled to `wasm32-wasip2` (WASI Preview 2)

### WIT Interfaces
- Type-safe contracts between components
- Similar to TypeScript interfaces but for WASM
- Auto-generates bindings for imports/exports

## Workflow Flow

```
Ticket Created
    ↓
[Analyze] → AI extracts intent, sentiment, urgency
    ↓
Deterministic Routing
    ├─ Critical? → Notify Team + Escalate
    ├─ High Priority? → Search KB → Generate Response
    └─ Normal? → Auto-resolve with KB
    ↓
[Update Status] → Mark ticket resolved/in-progress
    ↓
Resolution Complete
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [Obelisk](https://obeli.sk) workflow engine (for running WASM components)

### Installation

```bash
# Install dependencies
bun install

# Build all packages (TypeScript → WASM)
./scripts/build-all.sh
```

### Build Output

After building, you'll find WASM components in:
- `packages/workflows/dist/ticket-resolution.wasm`
- `packages/activities/ai-activities/dist/*.wasm`
- `packages/activities/ticket-activities/dist/*.wasm`
- `packages/activities/notify-activities/dist/*.wasm`

### Running with Obelisk

```bash
# Start Obelisk server (requires Obelisk installation)
obelisk server --db sqlite://obelisk.db

# Load workflow component
obelisk component add workflow packages/workflows/dist/ticket-resolution.wasm

# Load activity components
obelisk component add analyze-ticket packages/activities/ai-activities/dist/analyze-ticket.wasm
obelisk component add search-kb packages/activities/ai-activities/dist/search-kb.wasm
# ... load other activities

# Execute workflow
obelisk workflow execute ticket-workflow process-ticket \
  --args '{"ticket-id": "TICKET-001", "ticket-text": "Cannot reset my password urgently!"}'
```

## Development

### Build Commands

```bash
# Build everything
bun run build

# Build only workflows
bun run build:workflows

# Build only activities
bun run build:activities

# Clean all build artifacts
./scripts/clean-all.sh

# Type checking
bun run typecheck
```

### Package Scripts

Each package has its own build process:

```bash
# Build a specific package
cd packages/workflows
bun run build

# Build specific activity
cd packages/activities/ai-activities
bun run build
```

## Idempotency Pattern

All activities implement the idempotency pattern:

```typescript
const cache = new Map<string, Result>();

export async function activity(
    input: Input,
    idempotencyKey: string
): Promise<Result> {
    // Return cached result if exists
    if (cache.has(idempotencyKey)) {
        return cache.get(idempotencyKey)!;
    }

    // Perform operation
    const result = await performOperation(input);

    // Cache for future retries
    cache.set(idempotencyKey, result);
    return result;
}
```

This ensures:
- Same idempotency key always returns same result
- Safe to retry operations without side effects
- Critical for Obelisk's deterministic execution model

## Example Tickets

See [examples/sample-tickets.json](examples/sample-tickets.json) for sample test data:

1. **Critical Authentication Issue** → Notifies team, escalates
2. **Billing Question** → Searches KB, auto-resolves
3. **Feature Request** → Auto-resolves with acknowledgment

## Technology Stack

- **[Obelisk](https://obeli.sk)**: Deterministic workflow engine
- **[ComponentizeJS](https://github.com/bytecodealliance/ComponentizeJS)**: TypeScript → WASM compiler
- **[Bun](https://bun.sh)**: Fast JavaScript runtime and package manager
- **[WIT](https://component-model.bytecodealliance.org)**: WebAssembly Interface Types
- **TypeScript**: Type-safe development

## How It Works

1. **TypeScript Code** → Written with activity imports declared
2. **Transpilation** → `tsc` compiles TypeScript to JavaScript
3. **Componentization** → `jco componentize` wraps JS in WASM component
4. **WIT Binding** → Component interfaces defined in `.wit` files
5. **Obelisk Execution** → Workflow orchestrates activities deterministically

## Key Features

- **Deterministic Execution**: Workflows always produce same result given same inputs
- **Automatic Retries**: Activities are idempotent and safe to retry
- **Crash Recovery**: Workflows can resume from any point using execution log
- **Type Safety**: WIT interfaces provide compile-time type checking
- **Composability**: Activities can be reused across different workflows

## Learn More

- [Obelisk Documentation](https://obeli.sk/docs)
- [WebAssembly Component Model](https://component-model.bytecodealliance.org)
- [ComponentizeJS Guide](https://github.com/bytecodealliance/ComponentizeJS)
- [Bun Documentation](https://bun.sh/docs)

## License

MIT

---

Built with the Obelisk workflow engine - making distributed systems deterministic and reliable.
