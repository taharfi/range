# Meteora Agent Resources

**Reviewed:** 2026-10-21  
**Sources:** [Agents overview](https://docs.meteora.ag/agents/overview), [Documentation MCP](https://docs.meteora.ag/agents/mcp), [Meteora Agent Skill](https://docs.meteora.ag/agents/skill), [documentation index](https://docs.meteora.ag/llms.txt)

## Documentation MCP

Meteora publishes a read-only HTTP documentation MCP server at `https://docs.meteora.ag/mcp`. The documented capabilities are search and exact-page retrieval across product docs, developer guides, API references, program references and skill resources. The page explicitly says it does not execute API calls, submit transactions, sign wallets, mutate documentation or manage funds.

**RANGE use:** later Codex sessions could use MCP for current documentation lookup and citation while keeping implementation, wallet signing and execution in local reviewed code. No MCP configuration was added during this research.

## Agent Skill

The Agent Skill is described as a portable instruction set for AI coding agents. It packages an action playbook and safety gates, including dry-run and confirmation behavior, and is distributed in the `skills/meteora` path of the Meteora Invent repository. The official guidance separates:

1. Discover the relevant product, guide, SDK or API.
2. Read exact context.
3. Implement against SDK/API/program references.
4. Execute deliberately through reviewed scripts, wallets, SDK integrations or Invent, with signing controlled by the user.

**RANGE use:** suitable for a later implementation review, not a substitute for transaction policy, simulation, authority management or security review. The skill should not be installed or configured as part of this research phase.

## BUILD and ACT boundaries

The agent overview presents documentation and SDK work as the build path, while on-chain action is an intentional execution path controlled through scripts, wallets, SDK integration or Invent. This is a useful boundary for RANGE:

- **BUILD-like work:** read docs, generate or review code, construct a proposed transaction, simulate and surface expected effects.
- **ACT-like work:** require explicit user intent, signer authority, transaction review and submission outside the research-only MVP.

## Safety findings

- Never provide keys or seed phrases to an agent.
- Prefer localnet/devnet before mainnet.
- Treat generated transaction code and large changes as proposals until reviewed.
- MCP documentation access is not execution authority.

## Setup recommendation for later review

1. Review the current Codex/VS Code tool policy.
2. If desired, add the read-only docs MCP in a separate development change.
3. Use the Agent Skill only after its repository revision, safety gates and supported actions are reviewed.
4. Keep signer custody and final approval outside the agent context.
5. Add simulation, allowlists, slippage, account-creation and failure-recovery checks before any production execution experiment.

No setup was performed during this phase.
