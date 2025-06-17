import 'passport';

import type { CreateAccountDto } from '~/auth/dto';

declare global {
    namespace Express {
        export interface User {
            id: number;
            email: CreateAccountDto['email'];
            firstName: CreateAccountDto['firstName'];
            lastName: CreateAccountDto['firstName'];
            avatar: CreateAccountDto['firstName'];
        }
    }
}
