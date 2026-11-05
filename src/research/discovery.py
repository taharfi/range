from typing import Protocol, Iterable


class WalletDiscovery(Protocol):
    """Indexer adapter must include closed accounts, provenance and coverage bounds.

    Current account scans alone omit closed positions and cannot establish a cohort.
    Implementations must not claim complete history without transaction backfill.
    """

    def discover(self, pool: str, start_slot: int, end_slot: int) -> Iterable[dict]: ...
