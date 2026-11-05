# Meteora Invent Actions

**Reviewed:** 2026-10-21  
**Sources:** [Invent actions documentation](https://docs.meteora.ag/invent/actions), [Meteora Invent repository](https://github.com/MeteoraAg/meteora-invent), [Meteora Agent Skill](https://docs.meteora.ag/agents/skill)

## Scope

Meteora Invent is documented as a configuration-driven CLI toolkit for on-chain actions across Meteora programs. The docs require Node.js 22.12+, pnpm 10+, repository setup, configuration files and a wallet private key for actions that deploy or transact. No installation, configuration, key handling or transaction was performed.

## Relevant documented actions

| Surface | Documented actions | RANGE relevance | Signing/authority implication |
|---|---|---|---|
| DLMM | Launch pool, seed liquidity, single-bin seed, pool status, place/get/cancel limit order, swap, claim fees/rewards, get positions | Future entry/exit, fee management and position inspection | Transaction actions require a wallet and review |
| DAMM v2 | Launch balanced/one-sided pool, split position, claim fee, add/remove liquidity, close position, swap, get positions | Cross-product portfolio and execution research | Position authority and token handling required |
| DAMM v1 | Launch pool, liquidity lock and related actions | Adjacent protocol support | Action-specific authority required |
| Dynamic Vaults | Configuration-driven vault workflows | Possible managed-liquidity integration | Vault authority and strategy semantics require review |
| Pool Farms | Stake/unstake LP and farm actions | Reward and position operations | Farm accounts and reward assumptions require validation |
| Zap | Documented configuration surface | One-token entry/exit research | Composed swaps/liquidity actions require slippage and failure handling |
| Lock / escrow / stake surfaces | Lock, escrow and Stake2Earn actions | Not core to current RANGE MVP | Different authority and lifecycle semantics |

## Safety model

The Invent documentation points AI agents to the Agent Skill, which includes dry-run and confirmation safety gates. The documentation separately requires a private key environment variable for the wallet used by the CLI. This is operationally incompatible with treating Invent as a read-only analytics dependency. For RANGE, Invent should be considered an optional execution adapter rather than a data source.

## Feasibility assessment

- **Position inspection:** useful as a documented action surface, but current RANGE already has a read-only position path; adding Invent solely for inspection would add dependency and key-management burden.
- **Claim/withdraw/add liquidity:** technically relevant but requires authority checks, transaction simulation, rent/account handling, slippage policy and recovery UX.
- **Zap workflows:** potentially valuable for reducing manual steps, but exact semantics and cost accounting must be verified per action and pool.
- **Limit orders:** could support range/strategy workflows, but order fills and lifecycle events need independent monitoring.
- **DAMM v2 and vaults:** enable broader product coverage, but they are not a drop-in extension of DLMM accounting.

## Recommendation

**INTEGRATE later, selectively:** use Invent or its underlying SDK patterns only for reviewed, user-approved workflows where it materially reduces implementation effort.  
**DO NOT use now:** no transaction execution, key ingestion or configuration was added to RANGE.  
**Keep separate:** read-only intelligence should not require Invent, a private key or a signer.
