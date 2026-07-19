# AI Centrality Evaluator

Owned during planning by `product-logic-and-intelligence-grill` /
`plan-consistency-judge`, and during implementation by the `ai-orchestration-builder`
acceptance path. Applies whenever the product's central value depends on external
AI. Gates `real_ai_integration_verified`.

Rejects **fake AI production paths**. The evaluator checks that the AI — not a
fixed linear sequence or a scripted state machine — is responsible for the planned
behavior. Concrete acceptance checks:
- different user context yields meaningfully different next questions/outputs;
- the next step is **not** selected from a fixed linear sequence;
- the AI uses stored conversation/interaction context;
- AI output conforms to the required schema; invalid output is rejected or repaired;
- tool results actually influence the response;
- the deterministic layer does not silently replace AI judgment where AI is the owner;
- AI failure activates the documented fallback;
- mock/demo mode is not active in production configuration;
- the real provider adapter initializes when credentials exist and fails cleanly
  (startup validation) when they are absent.

Planning artifacts: `ai-responsibility-matrix.yaml`, `ai/ai-provider-contract.yaml`,
`ai/real-ai-integration-plan.yaml`. Reference: `system-building-os/policies/production-ready.md`.
Skills: `product-logic-and-intelligence-grill`, `real-ai-integration-planning`,
`ai-interface-implementation`, `ai-output-validation`.
