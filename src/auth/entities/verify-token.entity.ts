import { Expose } from 'class-transformer';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Account } from '~/auth/entities';

@Entity('verify_tokens')
export class VerifyToken {
    @Expose()
    @PrimaryGeneratedColumn()
    id: number;

    @Expose()
    @Column({ name: 'forgot_password_secret', default: '' })
    forgotPasswordSecret: string;

    @Expose()
    @Column({ name: 'email_otp_code', type: 'varchar', length: 6, nullable: true })
    emailOtpCode: string | null;

    @Expose()
    @Column({ name: 'email_otp_expires_at', type: 'timestamp', nullable: true })
    emailOtpExpiresAt: Date | null;

    @Expose()
    @Column({ name: 'email_otp_attempts', type: 'int', default: 0 })
    emailOtpAttempts: number;

    @Expose()
    @Column({ name: 'totp_secret', default: '' })
    totpSecret: string;

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
