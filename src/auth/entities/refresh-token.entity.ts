import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Account } from '~/auth/entities';

@Entity('refresh_tokens')
export class RefreshToken {
    @ApiProperty()
    @Expose()
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty()
    @Expose()
    @Column()
    token: string;

    @ApiProperty()
    @Expose()
    @Column({ name: 'expires_at' })
    expiresAt: Date;

    @ApiProperty()
    @Expose()
    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    /**
     * onDelete: 'CASCADE' để khi account bị xoá → refreshToken cũng xoá
     */
    @ApiProperty({ type: () => Account })
    @OneToOne(() => Account, account => account.refreshToken, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'account_id' })
    account: Account;

    constructor(partial: Partial<RefreshToken>) {
        Object.assign(this, partial);
    }
}
