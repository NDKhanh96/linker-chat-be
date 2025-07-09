import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Account } from '~/auth/entities';

@Entity('refresh_tokens')
export class RefreshToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id' })
    userId: number;

    @Column()
    token: string;

    @Column({ name: 'expires_at' })
    expiresAt: Date;

    /**
     * onDelete: 'CASCADE' để khi account bị xoá → refreshToken cũng xoá
     */
    @OneToOne(() => Account, account => account.refreshToken, { onDelete: 'CASCADE' })
    account: Account;

    constructor(partial: Partial<RefreshToken>) {
        Object.assign(this, partial);
    }
}
