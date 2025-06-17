import type { LoginAppMfaResDto, LoginJwtResDto } from '~/auth/dto';

export type LoginResponse = Prettify<LoginAppMfaResDto | LoginJwtResDto>;

export type JwtPayload = {
    email: string;
    sub: number;
};

export type QueryGoogleAuth = Record<'code_challenge' | 'code_challenge_method' | 'redirect_uri' | 'client_id' | 'response_type' | 'state' | 'scope', string>;

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
