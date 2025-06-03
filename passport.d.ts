import 'passport';

declare global {
    namespace Express {
        export interface User {
            id: number;
            email: string;
            firstName?: string;
            lastName?: string;
            avatar?: string;
        }
    }
}
