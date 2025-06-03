import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { JwtPayload } from '~/types';
import type { EnvFileVariables } from '~/utils/environment';

@Injectable()
/**
 * Sau khi inject vào module, ta có thể sử dụng GoogleStrategy trong AuthGuard('jwt') để bảo vệ các route cần xác thực bằng jwt.
 * Mặc định những route có AuthGuard('jwt') sẽ chạy quả phương thức validate() của JwtStrategy để xác thực người dùng.
 * Nếu xác thực thành công, phương thức validate() sẽ trả về một đối tượng người dùng đã được xác thực.
 */
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService<EnvFileVariables, true>) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET', { infer: true }),
        });
    }

    validate(payload: JwtPayload) {
        return { id: payload.sub, email: payload.email };
    }
}
