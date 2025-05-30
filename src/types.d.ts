import type { LoginAppMfaResDto, LoginJwtResDto } from '~/auth/dto';

export type LoginResponse = Prettify<LoginAppMfaResDto | LoginJwtResDto>;
