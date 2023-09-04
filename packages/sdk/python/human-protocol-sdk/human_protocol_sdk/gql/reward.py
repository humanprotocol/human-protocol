reward_added_event_fragment = """
fragment RewardAddedEventFields on RewardAddedEvent {
    escrowAddress
    staker
    slasher
    amount
}
"""

get_reward_added_events_query = """
query GetRewardAddedEvents($slasherAddress: String!) {{
    rewardAddedEvents(where: {{ slasher: $slasherAddress }}) {{
        ...RewardAddedEventFields
    }}
}}
{reward_added_event_fragment}
""".format(
    reward_added_event_fragment=reward_added_event_fragment
)
