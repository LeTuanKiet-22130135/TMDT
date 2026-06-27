import { gql } from '@apollo/client';
import { cacaoClient } from '../apollo';

const TRACK_EVENT = gql`
  mutation TrackEvent($userId: String!, $productId: String!, $eventType: String!) {
    trackEvent(userId: $userId, productId: $productId, eventType: $eventType)
  }
`;

export type RedEventType = 'view' | 'cart' | 'search' | 'follow' | 'purchase';

/**
 * Fire-and-forget: send interaction event to bk-cacao recommendation engine.
 * Silently drops if user not logged in or network fails.
 */
export const trackEvent = (
  userId: string | undefined | null,
  productId: string | undefined | null,
  eventType: RedEventType,
): void => {
  if (!userId || !productId) return;
  cacaoClient
    .mutate({ mutation: TRACK_EVENT, variables: { userId, productId, eventType } })
    .catch(() => {});
};
