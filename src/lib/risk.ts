export const IRREVERSIBLE_ACTIONS = [
  "send_email",
  "post_message",
  "delete",
  "create_event_with_guests",
  "GMAIL_SEND_EMAIL",
  "SLACK_POST_MESSAGE",
  "SLACK_CHAT_POST_MESSAGE",
  "GMAIL_CREATE_DRAFT",
] as const;

export type IrreversibleAction = typeof IRREVERSIBLE_ACTIONS[number];

export function isIrreversibleAction(actionName: string): boolean {
  const normalized = actionName.toLowerCase();
  
  if (IRREVERSIBLE_ACTIONS.some((action) => normalized.includes(action.toLowerCase()))) {
    return true;
  }

  if (normalized.includes("send") && normalized.includes("email")) {
    return true;
  }

  if (normalized.includes("post") && normalized.includes("message")) {
    return true;
  }

  if (normalized.includes("delete")) {
    return true;
  }

  return false;
}
