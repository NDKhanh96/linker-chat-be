import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { Account } from '~/auth/entities';

@Entity('verify_tokens')
export class VerifyToken {
    @PrimaryColumn()
    id: number;

    @Column({ default: '' })
    forgotPasswordSecret: string;

    @Column({ default: '' })
    mailMfaSecret: string;

    @Column({ default: '' })
    appMfaSecret: string;

    @Column()
    userId: number;

    @Column()
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
