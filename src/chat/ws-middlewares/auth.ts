import { Logger } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { ExtendedError } from 'socket.io';

import type { AuthSocket, JwtPayload } from '~/types';

/**
 * Middleware xác thực JWT trước khi cho phép connection
 */
export const createSocketAuthMiddleware =
    (jwtService: JwtService, logger: Logger) =>
    (socket: AuthSocket, next: (err?: ExtendedError) => void): void => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error('Authentication token not found'));
        }

        jwtService
            .verifyAsync<JwtPayload>(token)
            .then(payload => {
                socket.data.accountId = payload.sub;
                socket.data.user = {
                    accountId: payload.sub,
                    email: payload.email,
                    firstName: payload.firstName,
                    lastName: payload.lastName,
                    avatar: payload.avatar,
                };

                next();
            })
            .catch((error: unknown) => {
                logger.error(error);

                next(new Error('Authentication failed'));
            });
    };
