import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { type Profile, Strategy } from 'passport-google-oauth20';
import type { VerifiedCallback } from 'passport-jwt';

import type { EnvFileVariables } from '~/utils/environment';

@Injectable()
/**
 * Sau khi inject vào auth module, ta có thể sử dụng GoogleStrategy trong AuthGuard('google') để bảo vệ các route cần xác thực bằng Google OAuth 2.0.
 * Mặc định những route có AuthGuard('google') sẽ chạy quả phương thức validate() của GoogleStrategy để xác thực người dùng.
 * Nếu xác thực thành công, phương thức validate() sẽ trả về một đối tượng người dùng đã được xác thực.
 * Đối tượng này sẽ được gán vào req.user và có thể được sử dụng trong các route handler.
 */
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private readonly configService: ConfigService<EnvFileVariables, true>) {
        super({
            clientID: configService.get('GOOGLE_CLIENT_ID', { infer: true }),
            clientSecret: configService.get('GOOGLE_CLIENT_SECRET', { infer: true }),
            callbackURL: `${configService.get('BASE_URL', { infer: true })}/api/auth/google/callback`,
            scope: ['email', 'profile'],
        });
    }

    validate(accessToken: string, _refreshToken: string, profile: Profile, done: VerifiedCallback): void {
        const { email, given_name, family_name, picture } = profile._json;

        const user = {
            email: email,
            firstName: given_name,
            lastName: family_name,
            avatar: picture,
            accessToken,
        };

        done(null, user);
    }
}
