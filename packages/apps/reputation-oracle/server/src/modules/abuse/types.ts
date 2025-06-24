import { ChainId } from '@human-protocol/sdk';

export type ReportAbuseInput = {
  userId: number;
  chainId: ChainId;
  escrowAddress: string;
  reason?: string;
};

export type SlackInteractionBase = {
  type: string;
  team: {
    id: string;
    domain: string;
  };
  user: {
    id: string;
    username: string;
    name: string;
    team_id: string;
  };
  api_app_id: string;
  token: string;
  trigger_id: string;
  is_enterprise_install: boolean;
  enterprise: null | object;
};

export type InteractiveMessage = SlackInteractionBase & {
  type: 'interactive_message';
  actions: {
    name: string;
    type: string;
    value: string;
  }[];
  callback_id: string;
  channel: {
    id: string;
    name: string;
  };
  action_ts: string;
  message_ts: string;
  attachment_id: string;
  original_message: {
    subtype: string;
    text: string;
    attachments: object[];
    type: string;
  };
  response_url: string;
  trigger_id: string;
};

export type ViewSubmission = SlackInteractionBase & {
  type: 'view_submission';
  view: {
    callback_id: string;
    private_metadata: string;
    state: {
      values: {
        [blockId: string]: {
          [actionId: string]: {
            type: string;
            value: number;
          };
        };
      };
    };
  };
};

export type SlackInteraction = InteractiveMessage | ViewSubmission;

export function isInteractiveMessage(
  data: SlackInteraction,
): data is InteractiveMessage {
  return data.type === 'interactive_message';
}

export function isViewSubmission(
  data: SlackInteraction,
): data is ViewSubmission {
  return data.type === 'view_submission';
}
