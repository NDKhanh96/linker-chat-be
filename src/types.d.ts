import type { Request } from 'express';
import type { DefaultEventsMap, Server, Socket } from 'socket.io';

export type JwtPayload = {
    email: string;
    sub: number;
    firstName: string;
    lastName: string;
    avatar: string;
};

export type QueryGoogleAuth = Record<'code_challenge' | 'code_challenge_method' | 'redirect_uri' | 'response_type' | 'state' | 'scope', string> & {
    client_id: 'google' | 'facebook' | 'github';
};

export type QueryGoogleCallback = Record<'state' | 'code' | 'scope' | 'authuser' | 'prompt', string>;

type Jwk = {
    kid: string;
    e: string;
    n: string;
    alg: string;
    kty: 'RSA';
    use: 'sig';
};

export type JwksResponse = {
    keys: Jwk[];
};

export type GoogleIdTokenDecoded = {
    header: {
        alg: string;
        kid: string;
        typ: string;
    };
    payload: {
        iss: string;
        azp: string;
        aud: string;
        sub: string;
        email: string;
        email_verified: boolean;
        at_hash: string;
        name: string;
        picture: string;
        given_name: string;
        family_name: string;
        iat: number;
        exp: number;
    };
    signature: string;
};

type AuthenticatedMockRequest = Request & {
    user: Express.User;
};

type SocketData = {
    accountId: number;
    user: Omit<JwtPayload, 'sub'> & { accountId: number };
    conversationIds?: number[];
};

export type AuthSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData> & { handshake: { auth: { token: string } } };

export type AuthServer = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;
