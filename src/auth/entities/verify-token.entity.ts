import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { Account } from '~/auth/entities';

@Entity('verify_tokens')
export class VerifyToken {
    @PrimaryColumn()
    id: number;

    @Column({ name: 'forgot_password_secret', default: '' })
    forgotPasswordSecret: string;

    @Column({ name: 'mail_mfa_secret', default: '' })
    mailMfaSecret: string;

    @Column({ name: 'app_mfa_secret', default: '' })
    appMfaSecret: string;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ name: 'user_email' })
    userEmail: string;

    /**
     * onDelete: 'CASCADE' để khi account bị xoá → verifyToken cũng xoá
     */
    @OneToOne(() => Account, account => account.verifyToken, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id' })
    account: Account;

    constructor(partial: Partial<VerifyToken>) {
        Object.assign(this, partial);
    }
}
