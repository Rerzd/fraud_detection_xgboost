"""Sample transactions for the UI.

Each `label` is the risk level the model actually assigns (checked in
tests/api/test_explainability.py); they were chosen by scoring candidates, not by hand-assigning
labels.
"""

EXAMPLES = [
    {
        "id": "notebook-fraud",
        "label": "high",
        "description": "Known fraud from the notebook test set: full balance moved to an account "
        "whose balances never change.",
        "transaction": {
            "type": "TRANSFER",
            "step": 459,
            "amount": 1153156.0,
            "oldbalanceOrg": 1153156.0,
            "newbalanceOrig": 0.0,
            "oldbalanceDest": 0.0,
            "newbalanceDest": 0.0,
        },
    },
    {
        "id": "cashout-drain",
        "label": "high",
        "description": "Cash-out empties the origin account but the destination balance "
        "does not move.",
        "transaction": {
            "type": "CASH_OUT",
            "step": 400,
            "amount": 150000.0,
            "oldbalanceOrg": 150000.0,
            "newbalanceOrig": 0.0,
            "oldbalanceDest": 200000.0,
            "newbalanceDest": 200000.0,
        },
    },
    {
        "id": "half-to-empty-dest",
        "label": "review",
        "description": "Half of the origin balance transferred to a destination with 0/0 balances.",
        "transaction": {
            "type": "TRANSFER",
            "step": 350,
            "amount": 400000.0,
            "oldbalanceOrg": 800000.0,
            "newbalanceOrig": 400000.0,
            "oldbalanceDest": 0.0,
            "newbalanceDest": 0.0,
        },
    },
    {
        "id": "consistent-cashout",
        "label": "low",
        "description": "Routine cash-out; both accounts reconcile exactly with the amount.",
        "transaction": {
            "type": "CASH_OUT",
            "step": 120,
            "amount": 18500.0,
            "oldbalanceOrg": 42300.0,
            "newbalanceOrig": 23800.0,
            "oldbalanceDest": 150000.0,
            "newbalanceDest": 168500.0,
        },
    },
    {
        "id": "consistent-transfer",
        "label": "low",
        "description": "Partial transfer between two active accounts with consistent balances.",
        "transaction": {
            "type": "TRANSFER",
            "step": 300,
            "amount": 250000.0,
            "oldbalanceOrg": 800000.0,
            "newbalanceOrig": 550000.0,
            "oldbalanceDest": 120000.0,
            "newbalanceDest": 370000.0,
        },
    },
]
