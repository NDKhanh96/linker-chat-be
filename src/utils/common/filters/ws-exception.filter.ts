import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

import type { AuthSocket } from '~/types';

/**
 * Filter bắt {@link WsException} và các lỗi thông thường trong WebSocket context,
 * sau đó emit sự kiện `error` về client với message tương ứng.
 *
 * @example
 * ```typescript
 * @UseFilters(WsExceptionFilter)
 * export class ChatGateway {}
 * ```
 *
 * @remarks
 * `@UseFilters` chỉ có tác dụng với `@SubscribeMessage` handlers,
 * **không** áp dụng cho lifecycle hooks (`handleConnection`, `handleDisconnect`).
 * Với các lifecycle hooks, cần bắt lỗi thủ công bằng try-catch.
 */
@Catch(WsException)
export class WsExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const client = host.switchToWs().getClient<AuthSocket>();

        let message = 'Internal server error';

        if (exception instanceof WsException) {
            const err = exception.getError();

            message = typeof err === 'string' ? err : JSON.stringify(err);
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        client.emit('error', { message });
    }
}
