import type { LoginAppMfaResDto, LoginJwtResDto } from '~/auth/dto';

export type LoginResponse = Prettify<LoginAppMfaResDto | LoginJwtResDto>;

export type JwtPayload = {
    email: string;
    sub: number;
};
