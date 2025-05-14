import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { User } from '~/user/entities';

@Entity('verify_tokens')
export class VerifyToken {
    @PrimaryColumn()
    id: number;

    @Column({ default: '' })
    forgotPasswordSecret: string;

    @Column({ default: '' })
    mailMFASecret: string;

    @Column({ default: '' })
    appMFASecret: string;

    @Column()
    userId: number;

    @Column()
    userEmail: string;

    @OneToOne(() => User, user => user.verifyToken)
    @JoinColumn({ name: 'id' })
    user: User;

    constructor(partial: Partial<VerifyToken>) {
        Object.assign(this, partial);
    }
}
