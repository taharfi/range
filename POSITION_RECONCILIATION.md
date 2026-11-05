# Position reconciliation — 2026-10-19

## Independent evidence gates

- **10 genuinely closed accounts**: explicit PositionClose event in successful finalized transactions, plus zero post-transaction lamports at the position account index. A RemoveLiquidity event alone never passes this test.
- **10 complete retrievable event histories**: position-address signature paging exhausted, one decoded creation and closure, all successful returned transaction bodies fetched, monotonic block timestamps and no unknown event discriminator. This means completeness under the RPC's returned address history; it is not a guarantee of provider-wide historical indexing fidelity.
- **10 token cash-flow reconciliations pass**: canonical event amounts equal independently decoded SPL transfers to/from the pool reserves transaction by transaction. Multiple deposits, partial removals, rebalances and compatibility fee events are included.
- **0 trustworthy USD P&Ls; 0 valid USD hold benchmarks**: timestamp-aligned mint/USD prices and complete economic-cost allocation remain missing. API `totalUsd` values are retained as source estimates only.
- **9 funded positions and 1 never-funded closed account**. The latter is a real account closure, not an LP investment return. 0 reward-claim events were observed; this is not proof rewards never existed elsewhere. No ownership change was observed in this sample; differing owners would block owner-level accounting.

## Methods and limitations

The primary finalized interval was slots 458874016–458874079. It contained eight closures. Before decoding more results, a second adjacent interval 458874080–458874143 was frozen and fully scanned; it supplied two additional closures. All returned produced blocks were fetched, including transactions that did not interact with DLMM. No current-open-account filter or wallet profit ranking was used.

For every closed position, getSignaturesForAddress was paged to exhaustion (1000/page, four-page safety budget), followed by getTransaction for every successful returned signature up to closure. Creation can precede the scan interval: the closure window discovers the cohort; per-address history reconstructs its lifetime. Failed transaction signatures are retained in raw responses; they do not emit committed cash flows. Their fees are not included in successful-lifecycle fee totals and remain an economic-cost completeness limitation.

The official DLMM IDL fetched for this phase matches the stored schema. Events are read from Anchor event-CPI inner instructions, using loaded address-table keys when present. Unknown bytes and decoding failures are retained and block completeness; no unmatched event is silently discarded. ClaimFee/ClaimFee2 and ClaimReward/ClaimReward2 aliases are paired only on matching fields within the same transaction/invocation. **19 compatibility aliases** were suppressed from cash-flow sums while raw events remain in Parquet/JSON.

Rebalance fields are incorporated as deposits, withdrawals and fees only where they reconcile to actual reserve transfers. Internal or ambiguous transfers would fail the gate. CompositionFee events lack a position field: attribution requires a unique position and matching sender in the same outer invocation. These fees are recorded as embedded deposit/rebalance costs and are not subtracted a second time from already reconciled external deposits. Token-program account initialization/closure and native wrapping instructions are retained separately; they are not invented LP transfers.

Historical token decimals are checked against pre/post token balances in the actual lifecycle transactions for funded positions. Raw u64 quantities stay integers; normalized values use Decimal. The never-funded account has no token-balance observations and does not require token scaling to reconcile zero cash flows.

Pool reserve addresses come from current pool metadata; agreement with lifecycle transfer endpoints is verified. Any mismatch fails reconciliation. Historical pair OHLCV was requested in five-minute windows around creation and closure. Pair candles can contain trades after the event and do not independently establish both mint/USD prices. They are retained with `usable_for_usd_pnl=false`. No stablecoin $1 peg, current Jupiter price or zero-valued missing price is substituted.

Observed transaction fees are `meta.fee` in lamports, once per fetched successful transaction per position. Payer and transaction context are retained. Full fees are **not automatically allocated** to the LP where other instructions/payers are involved. Account rent before closure is recorded separately; refunded rent is not investment income. Tips, failed-transaction fees, ATA rent and external hedge/swap activity are not claimed as fully allocated economic costs.

## Closed position evidence

| Position | Funded | Created UTC | Closed UTC | Signatures | History / cash flows | Creation / closure verification |
|---|---|---|---|---:|---|---|
| [4TGE9Yfhg1BNhxLNnX7L3HAKqqo2T75PQjHB7ppf1NkW](https://solscan.io/account/4TGE9Yfhg1BNhxLNnX7L3HAKqqo2T75PQjHB7ppf1NkW) | True | 2026-10-19T14:50:23+00:00 | 2026-10-19T14:55:11+00:00 | 2 | True / True | [create](https://solscan.io/tx/4yLbXwRCRVUALJyVjeg6eZCQxHoBFrVbLVHnmES3V45137frjnkeCC2izkrunisfKkudcPRCxQYxeKzxfra6UXV9) / [close](https://solscan.io/tx/2JWokjBeA2Vo4515STaYaFuXLHc6CAVWabGbMekQgBwGZVxwiJ2Yoq6W5eJihpu1tNvw47m6hqkvSrKaWBhtQaRi) |
| [FG2tXXffnJ8ftXnuUdTkofRNgobMXBUZA5jcwccPzP5B](https://solscan.io/account/FG2tXXffnJ8ftXnuUdTkofRNgobMXBUZA5jcwccPzP5B) | True | 2026-10-19T02:28:17+00:00 | 2026-10-19T14:55:11+00:00 | 7 | True / True | [create](https://solscan.io/tx/4VnazJepP3LNNFm4nnjVupaopU3AmwfoXN5fW5atD5KjUCXEkEzbxu7eHdyPueRHNDtPsexmj4PPDxapfSD5q7S9) / [close](https://solscan.io/tx/3JZbdLNDmT7M7DgzLNjZMsccdXTuTbVmswtU8HSHnRM1RKfpftJaucHML8X4vz2ifF9WxQutzKLQvDBJ7wD5JkTk) |
| [5CQtfEe3fNkAivFYHhyKkEf56hrrgAMqnGvgd3MqXxz9](https://solscan.io/account/5CQtfEe3fNkAivFYHhyKkEf56hrrgAMqnGvgd3MqXxz9) | True | 2026-10-18T00:56:59+00:00 | 2026-10-19T14:55:12+00:00 | 7 | True / True | [create](https://solscan.io/tx/64js34MMVBn4boiDRUDoQ1hx43n2rbuZQMzA3KEKyboAqTrEJURjU6FMNP53AqcGz7nRinaeV1E9GygXKbCibfnz) / [close](https://solscan.io/tx/emR1Gnba1VzENUSCCXUj21AkqbKKNcQgmWZaxY7Ms52SqJ9X1tZHDycjQ7fksGV2kJtbxf7jvNh6JzXjse7PnwC) |
| [5e2WHUb3DKt4HDrYs5smUB3utNxE9yxM9P8UGQBpRake](https://solscan.io/account/5e2WHUb3DKt4HDrYs5smUB3utNxE9yxM9P8UGQBpRake) | True | 2026-10-19T07:08:29+00:00 | 2026-10-19T14:55:12+00:00 | 3 | True / True | [create](https://solscan.io/tx/KmUDt3iXszgZ9Q1EkFkZzwCjPLH1DVtpLcSrXhhoroo6vAdXwZ7sx8hK5sbMA3FbNJLaXY7eGkNL4xgo2AgXo7q) / [close](https://solscan.io/tx/2JKEgAvuUEgfXzxQNfQH2bRtVA95ZPyKa9YbgXMubFsN1KZ62BpHvK821x2euyxShiGKPp7fe4Mobb2fcGWfHR2i) |
| [6dT3sHtS99N2Wdwp72td7S9Sgno9ShQ8aSceBKovrggw](https://solscan.io/account/6dT3sHtS99N2Wdwp72td7S9Sgno9ShQ8aSceBKovrggw) | True | 2026-10-19T10:54:13+00:00 | 2026-10-19T14:55:17+00:00 | 5 | True / True | [create](https://solscan.io/tx/4bjM939pTJMX8rUK2ZXRqzir7EYNZMFQpf5z46SBLcJG2gT1fSUbjtuHdoTVrPgtq8xVDpb8WY5mPkXU9vKqpgth) / [close](https://solscan.io/tx/s3e1PjLk9L2wGhCK7SafxnJVY4vGMwZPwtG5nv4gCkaF4wJWdq4jUwaxuoQf7B8pd7avDFA5Stkd5DegehEFsUT) |
| [98ZHcwda54TtagqZduo8Gt4MAMHmvNYmQ9GAFuVGhKj7](https://solscan.io/account/98ZHcwda54TtagqZduo8Gt4MAMHmvNYmQ9GAFuVGhKj7) | True | 2026-10-19T14:50:59+00:00 | 2026-10-19T14:55:17+00:00 | 2 | True / True | [create](https://solscan.io/tx/4fySE6fuFFQvt1NEch5hh3832L2MoVfB2f9tKTz5b6TzB3J19iThEyyd6jQ3MBF1hDHAc6jTfR6UhB5UP5c5QZuG) / [close](https://solscan.io/tx/4ZHewBwuqbsAPVDBc5u5b4fkvR8ELALTZyPUR9B83M81w1nq2w4XiVpdZFzajBDh6CNKrabGT7uQm8G8kMe8BrLz) |
| [Ge8qeYoGwcjdrkXayuGR7kkoyqDc7wcXcXByDwJijumd](https://solscan.io/account/Ge8qeYoGwcjdrkXayuGR7kkoyqDc7wcXcXByDwJijumd) | True | 2026-10-19T13:56:57+00:00 | 2026-10-19T14:55:17+00:00 | 7 | True / True | [create](https://solscan.io/tx/3GqbntHj2m8x5QE4vnyrj7XwLNtdMgYj9TGX9smfzC9yZPKVx7Mg3JghDWLdWWsbYntpz5fHqtT2d3EHx33wAGuQ) / [close](https://solscan.io/tx/3f3AbSz9w4biUJMWnazySG8qnZTWYJdEZDcd1BKwQ3nVi92SBdJCYe7crM7BRzGKsazGj7kQNa3ym6cP5jPESSM4) |
| [9otrkp8b4sJNWLDnKLAsBVZNaijeW1gQUEtzEBt8cV1y](https://solscan.io/account/9otrkp8b4sJNWLDnKLAsBVZNaijeW1gQUEtzEBt8cV1y) | True | 2026-10-12T16:06:54+00:00 | 2026-10-19T14:55:18+00:00 | 5 | True / True | [create](https://solscan.io/tx/4iD5PvLCrA3JYEw8gQPqNqTcCv8r89CX1FJsHT9vcWia65Bt3jAAb9B2pzWWDzeJvHe8b3DTcaFr1QYgJiUzcSkY) / [close](https://solscan.io/tx/5ZsGUrHYo77QGWHzoQPGroYNxMBDK4nqZ8mednPYT2LfiosUSTW6X9bSwZUmVN8gVRsubTMdea5w86Lzg69Mc4vi) |
| [9RGjjjdeHxKJWsCab7rhnRpBr1kh8q1TiZ5ypHdPEeac](https://solscan.io/account/9RGjjjdeHxKJWsCab7rhnRpBr1kh8q1TiZ5ypHdPEeac) | False | 2026-10-19T14:52:39+00:00 | 2026-10-19T14:55:26+00:00 | 2 | True / True | [create](https://solscan.io/tx/4Pek1g4XhThqA7BPsjvXxkEUWxUqSumJkFnuCpoXXaSBWJ88vGs5JnMzaBK9hPCottrJrR4vsEqQy7eEkju1Pj6D) / [close](https://solscan.io/tx/4MVMLRfmpeTMgCUD3Y1f9kwU3x4EJZx3kwm7D4Fx1FSJaCt9L7EdPY3YQL56u3okFR9nWzqNzDF4F7pppDjp12dD) |
| [EJTbbJ3M2TZCVmFm3VQ14aSjF8Fc2rtgZGRhhXTn5aXe](https://solscan.io/account/EJTbbJ3M2TZCVmFm3VQ14aSjF8Fc2rtgZGRhhXTn5aXe) | True | 2026-10-19T13:57:39+00:00 | 2026-10-19T14:55:27+00:00 | 6 | True / True | [create](https://solscan.io/tx/3mgcDv8BNCDGe4j8E4LaJtEA4nJNp1JXZ3fjsKCnEjrYtarddZCbfmi2dehphkxmg1rXmgpt4uErURVuumjch9KV) / [close](https://solscan.io/tx/5Bvvyip5fUu8SFLmruaGp1vUbrTM8KKc5kcdV4HXAQzFtgbkCzD56BZiEUtKi5L6yys7Kr1XmSbvMbMwSRUVpe2b) |

## Exact token cash flows and directly observed transaction fees

All quantities below are atomic token integers. Mint addresses and scales are in CLOSED_POSITIONS.csv and the JSON evidence. Withdrawals and fee claims remain separate.

| Position | X deposits / withdrawals / fees | Y deposits / withdrawals / fees | Observed successful-transaction fee lamports |
|---|---|---|---:|
| 4TGE9Yfhg1BNhxLNnX7L3HAKqqo2T75PQjHB7ppf1NkW | 0 / 1301680607 / 1194169 | 99999970 / 98597169 / 0 | 15000 |
| FG2tXXffnJ8ftXnuUdTkofRNgobMXBUZA5jcwccPzP5B | 0 / 407993791 / 83965360 | 299999925 / 279474152 / 3171698 | 40000 |
| 5CQtfEe3fNkAivFYHhyKkEf56hrrgAMqnGvgd3MqXxz9 | 0 / 4513497418 / 201896163 | 4999996665 / 4801932822 / 6814981 | 40000 |
| 5e2WHUb3DKt4HDrYs5smUB3utNxE9yxM9P8UGQBpRake | 72562860 / 72354548 / 196953 | 9999990 / 10027990 / 27252 | 84767 |
| 6dT3sHtS99N2Wdwp72td7S9Sgno9ShQ8aSceBKovrggw | 0 / 62942304009 / 1621512370 | 8684644934 / 7520764459 / 6632009 | 62000 |
| 98ZHcwda54TtagqZduo8Gt4MAMHmvNYmQ9GAFuVGhKj7 | 0 / 0 / 0 | 399999950 / 399999880 / 0 | 15000 |
| Ge8qeYoGwcjdrkXayuGR7kkoyqDc7wcXcXByDwJijumd | 0 / 0 / 0 | 499999962 / 499974318 / 474440 | 40000 |
| 9otrkp8b4sJNWLDnKLAsBVZNaijeW1gQUEtzEBt8cV1y | 0 / 0 / 0 | 2059999862 / 2059999862 / 0 | 109944 |
| 9RGjjjdeHxKJWsCab7rhnRpBr1kh8q1TiZ5ypHdPEeac | 0 / 0 / 0 | 0 / 0 / 0 | 22660 |
| EJTbbJ3M2TZCVmFm3VQ14aSjF8Fc2rtgZGRhhXTn5aXe | 0 / 0 / 4084600693 | 794336526 / 794338731 / 7676329 | 73601 |
