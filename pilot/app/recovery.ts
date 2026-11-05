import type { Lookup, Position } from "../lib/models";

export type PositionResults = Lookup & {handles: Record<string,string>};

// Recovery must never switch to another position, owner or pair on a partial lookup.
export function refreshedSelection(result: PositionResults, previous: Position) {
  const position = result.positions.find(p => p.address === previous.address);
  if (result.mode !== "live" || !position || !result.handles[position.address])
    throw new Error("This position was not returned as a supported open position. It may be closed or unavailable. The previous analysis has been retained.");
  if (position.owner !== previous.owner || position.pool !== previous.pool ||
      position.x.mint !== previous.x.mint || position.y.mint !== previous.y.mint ||
      position.x.decimals !== previous.x.decimals || position.y.decimals !== previous.y.decimals)
    throw new Error("The position's owner, pool or token details changed. Start a new analysis to review it; the previous analysis has been retained.");
  return {position, handle: result.handles[position.address]};
}
