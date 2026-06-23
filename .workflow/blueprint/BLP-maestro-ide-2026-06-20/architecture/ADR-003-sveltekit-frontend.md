# ADR-003: SvelteKit Frontend Framework

> Status: Accepted
> Date: 2026-06-20
> Deciders: System Architect, Product Manager
> Related Constraints: C-006

## Context

Maestro IDE requires a frontend framework for the browser-based UI. The frontend must support:

1. **Real-time data binding**: Workflow progress, terminal output, AI dialog streaming, project state updates -- all pushed via WebSocket and rendered immediately.
2. **Component architecture**: Reusable UI components for workflow cards, status trees, terminal emulator, diff preview, chat messages.
3. **Small bundle size**: Local app served from localhost; fast initial load is expected.
4. **Developer experience**: Hot module replacement, TypeScript support, clear component model.
5. **Future packaging**: The same frontend codebase should work when wrapped in Electron or Tauri for desktop distribution.

The backend is Node.js (mandated by C-006 for `child_process`/`node-pty` support). The frontend framework choice is independent but must integrate well with a Node.js backend.

## Decision

We WILL use **SvelteKit** as the frontend framework.

SvelteKit provides:
- **Svelte 5 runes**: Fine-grained reactivity with compile-time optimization; no virtual DOM overhead.
- **File-based routing**: Convention over configuration for page structure.
- **Server-side rendering**: Initial page load is pre-rendered; subsequent navigation is client-side.
- **Vite integration**: Fast HMR during development; optimized production builds.
- **Small runtime**: Svelte compiles components to imperative DOM operations; no framework runtime shipped to the browser.

## Alternatives Considered

### 1. React (with Vite or Next.js)

**Pros**:
- Largest ecosystem: most UI component libraries, most community resources, most Stack Overflow answers.
- Largest talent pool: most frontend developers know React.
- Rich component libraries: Radix UI, shadcn/ui, Mantine, Chakra UI.
- Next.js provides SSR, file-based routing, API routes.
- Proven in similar products: Open WebUI uses SvelteKit, but Cline, Continue.dev, and many AI tools use React.

**Cons**:
- **Virtual DOM overhead**: React re-renders component trees on state change; for a real-time dashboard with frequent WebSocket updates, this creates unnecessary work. React 19 concurrent features help but add complexity.
- **Larger bundle size**: React + ReactDOM runtime is ~40KB gzipped; Svelte runtime is near-zero (compiled away).
- **Boilerplate**: React components require `useState`, `useEffect`, `useCallback`, `useMemo` for optimal performance. Svelte's reactive declarations are more concise.
- **WebSocket integration**: React requires careful memoization and effect management to avoid stale closures with WebSocket event handlers. Svelte stores subscribe/unsubscribe automatically.
- **Next.js is server-heavy**: Next.js is designed for deployed web applications with server infrastructure. For a local app served from localhost, its server-side features (ISR, edge functions, image optimization) are unnecessary overhead.

**Verdict**: Strong alternative, but the virtual DOM overhead and boilerplate for real-time WebSocket-driven UI make SvelteKit a better fit for this specific use case.

### 2. Vue (with Nuxt)

**Pros**:
- Approachable API: Options API for simplicity, Composition API for flexibility.
- Good ecosystem: Vuetify, Naive UI, PrimeVue component libraries.
- Nuxt provides SSR, file-based routing, auto-imports.
- Smaller runtime than React (~33KB gzipped for Vue 3).
- Good TypeScript support in Vue 3.

**Cons**:
- **Smaller ecosystem than React**: Fewer component libraries, fewer community resources for niche use cases (xterm.js integration, diff viewers).
- **Reactivity system complexity**: Vue 3's Proxy-based reactivity has edge cases with WebSocket data streams and nested objects. Svelte's compile-time reactivity is more predictable.
- **Nuxt overhead**: Similar to Next.js, Nuxt is designed for deployed applications. Its server-side features are unnecessary for a local app.
- **Talent pool**: Smaller than React's, though growing.

**Verdict**: Viable alternative, but SvelteKit's compile-time reactivity and smaller runtime provide a better fit for the real-time, WebSocket-driven UI.

### 3. Vanilla JS / Web Components

**Pros**:
- Zero framework overhead; maximum performance.
- No build step required (optional with Vite).
- No framework lock-in; standard web APIs.

**Cons**:
- **No component model**: Must build component architecture from scratch (lifecycle, state management, event handling).
- **No SSR**: Cannot pre-render initial page load.
- **No routing**: Must implement client-side routing or use a lightweight router.
- **Development speed**: Building a dashboard with real-time updates, terminal emulator, diff viewer, and chat interface in vanilla JS is significantly slower than using a framework.
- **Maintenance burden**: Custom component architecture must be maintained and documented.

**Verdict**: Rejected. The development speed and maintenance cost outweigh the performance benefit for a product with 7 feature modules.

### 4. Solid.js

**Pros**:
- Fine-grained reactivity similar to Svelte (no virtual DOM).
- JSX syntax familiar to React developers.
- Small runtime (~7KB gzipped).
- Excellent performance benchmarks.

**Cons**:
- **Small ecosystem**: Very few UI component libraries; most React libraries are incompatible.
- **No full-stack framework**: Solid Start is less mature than SvelteKit; fewer conventions, less documentation.
- **Smaller community**: Fewer resources for troubleshooting, fewer contributors.
- **xterm.js integration**: No existing examples of xterm.js + Solid.js integration; would need custom wrapping.

**Verdict**: Technically excellent but ecosystem immaturity makes it risky for a product with diverse UI requirements (terminal, diff, chat, tree, dashboard).

## Consequences

### Positive

- **Optimal for real-time UI**: Svelte's compile-time reactivity means WebSocket-driven state updates trigger minimal DOM updates. No virtual DOM diffing overhead.
- **Small bundle size**: Svelte compiles away the framework; production bundles are significantly smaller than React/Vue equivalents.
- **Concise code**: Reactive declarations (`$:` in Svelte 4, `$derived`/`$effect` runes in Svelte 5) reduce boilerplate compared to React hooks.
- **WebSocket store integration**: Svelte stores auto-subscribe/unsubscribe in component lifecycle, eliminating stale closure bugs common in React WebSocket handlers.
- **SvelteKit conventions**: File-based routing, server load functions, form actions provide structure without configuration.
- **Vite HMR**: Fast development iteration; sub-second hot module replacement.
- **Future packaging**: SvelteKit's static adapter produces a pure HTML/JS/CSS bundle that works in any browser context (Electron, Tauri webview, or plain browser).

### Negative

- **Smaller ecosystem than React**: Fewer off-the-shelf component libraries. May need to build custom components for diff viewer, status tree, workflow cards.
- **Smaller talent pool**: Fewer developers know Svelte than React. Hiring and onboarding may take longer.
- **Svelte 5 migration**: Svelte 5 introduces runes (`$state`, `$derived`, `$effect`) which are a significant API change. Must decide whether to use Svelte 4 or 5 syntax.
- **xterm.js integration**: xterm.js is framework-agnostic but most examples and wrappers target React. Will need a custom Svelte wrapper component.

### Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Insufficient component libraries | Medium | Low | Build custom components; Svelte's simplicity makes this feasible |
| Svelte 5 breaking changes | Low | Medium | Pin Svelte 5 stable; follow migration guide; test before upgrading |
| xterm.js integration complexity | Low | Low | xterm.js is DOM-based; Svelte `onMount`/`bind:this` provides clean integration |
| Team unfamiliarity with Svelte | Medium | Low | Svelte's learning curve is shallow; most developers productive within 1-2 days |
| SvelteKit framework risk | Low | Low | SvelteKit is backed by Vercel; active development; large community |

## References

- SA-04: Node.js backend + SvelteKit frontend decision
- C-006: Backend MUST use Node.js; frontend MUST use SvelteKit
- Design Research: Open WebUI uses SvelteKit for local-first web app pattern
