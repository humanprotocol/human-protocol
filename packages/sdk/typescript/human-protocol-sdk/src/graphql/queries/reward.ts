import gql from 'graphql-tag';

const REWARD_ADDED_EVENT_FRAGMENT = gql`
  fragment RewardAddedEventFields on RewardAddedEvent {
    escrowAddress
    staker
    slasher
    amount
  }
`;

export const GET_REWARD_ADDED_EVENTS_QUERY = gql`
  query GetRewardAddedEvents($slasherAddress: String!) {
    rewardAddedEvents(where: { slasher: $slasherAddress }) {
      ...EscrowFields
    }
  }
  ${REWARD_ADDED_EVENT_FRAGMENT}
`;
