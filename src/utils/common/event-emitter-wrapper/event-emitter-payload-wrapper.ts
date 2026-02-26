import type { Message } from '~/messages/entities';
import type { User } from '~/user/entities';

type MessageSentPayload = { message: Message; conversationId: number };

export type AppEvent = { type: 'message.sent'; payload: MessageSentPayload } | { type: 'user.created'; payload: User };

export type EventPayload<T extends AppEvent['type']> = Extract<AppEvent, { type: T }>['payload'];
