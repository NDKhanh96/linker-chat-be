import { Expose } from 'class-transformer';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { Account } from '~/auth/entities';

@Entity('verify_tokens')
export class VerifyToken {
    @Expose()
    @PrimaryColumn()
    id: number;

    @Expose()
    @Column({ name: 'forgot_password_secret', default: '' })
    forgotPasswordSecret: string;

    @Expose()
    @Column({ name: 'mail_mfa_secret', default: '' })
    mailMfaSecret: string;

    @Expose()
    @Column({ name: 'app_mfa_secret', default: '' })
    appMfaSecret: string;

    @Expose()
    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    /**
     * onDelete: 'CASCADE' để khi account bị xoá → verifyToken cũng xoá
     */
    @OneToOne(() => Account, account => account.verifyToken, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'account_id' })
    account: Account;

    constructor(partial: Partial<VerifyToken>) {
        Object.assign(this, partial);
    }
}
