"""Descriptive rule observations about a raw transaction.

These are independent of the model: they describe the input, they do not explain the score.
"""

from collections.abc import Mapping

TOLERANCE = 0.01


def describe(tx: Mapping) -> list[str]:
    amount = tx["amount"]
    old_org, new_org = tx["oldbalanceOrg"], tx["newbalanceOrig"]
    old_dest, new_dest = tx["oldbalanceDest"], tx["newbalanceDest"]

    origin_empty = old_org == 0 and new_org == 0
    dest_empty = old_dest == 0 and new_dest == 0
    signals: list[str] = []

    if old_org > 0 and new_org == 0:
        signals.append("Origin account fully drained (balance after is 0).")
    if old_org > 0 and abs(amount - old_org) <= TOLERANCE:
        signals.append("Amount equals the full origin balance.")
    if origin_empty:
        signals.append(
            "Origin balances are 0 before and after despite a non-zero amount; "
            "treated as missing (NaN), as in training."
        )
    if dest_empty:
        signals.append(
            "Destination balances are 0 before and after despite a non-zero amount; "
            "sentinel -1 applied, as in training."
        )

    origin_gap = new_org + amount - old_org
    if not origin_empty and abs(origin_gap) > TOLERANCE:
        signals.append(f"Origin balance does not reconcile with the amount (gap {origin_gap:,.2f}).")
    dest_gap = old_dest + amount - new_dest
    if not dest_empty and abs(dest_gap) > TOLERANCE:
        signals.append(f"Destination balance does not reconcile with the amount (gap {dest_gap:,.2f}).")

    return signals
