import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '~/user/entities';

@Entity('refresh_tokens')
export class RefreshToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    token: string;

    @Column()
    expiresAt: Date;

    @OneToOne(() => User, user => user.refreshToken)
    user: User;

    constructor(partial: Partial<RefreshToken>) {
        Object.assign(this, partial);
    }
}
