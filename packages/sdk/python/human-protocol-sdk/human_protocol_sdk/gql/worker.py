from human_protocol_sdk.filter import WorkerFilter

worker_fragment = """
fragment WorkerFields on Worker {
    id
    address
    totalHMTAmountReceived
    payoutCount
}
"""


def get_worker_query() -> str:
    return """
query GetWorker($address: String!) {{
    worker(id: $address) {{
        ...WorkerFields
    }}
}}
{worker_fragment}
""".format(
        worker_fragment=worker_fragment
    )


def get_workers_query(filter: WorkerFilter) -> str:
    return """
query GetWorkers(
    $address: String
    $orderBy: String
    $orderDirection: String
    $first: Int
    $skip: Int
) {{
    workers(
        where: {{
            {address_clause}
        }}
        orderBy: $orderBy
        orderDirection: $orderDirection
        first: $first
        skip: $skip
    ) {{
        ...WorkerFields
    }}
}}
{worker_fragment}
""".format(
        worker_fragment=worker_fragment,
        address_clause=("address: $address" if filter.worker_address else ""),
    )
