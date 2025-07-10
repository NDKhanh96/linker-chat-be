import { Expose, Type } from 'class-transformer';
import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, VersionColumn } from 'typeorm';

import { Account } from '~/auth/entities';

/**
 * Account và User là liên hệ 1-1 với account là thực thể chính
 */
@Entity('users')
export class User {
    @Expose()
    @PrimaryGeneratedColumn()
    id: number;

    @Expose()
    @VersionColumn()
    version: number;

    @Expose()
    @Column({ name: 'first_name' })
    firstName: string;

    @Expose()
    @Column({ name: 'last_name' })
    lastName: string;

    @Expose()
    @Column()
    avatar: string;

    @Expose()
    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Expose()
    @Column({ name: 'updated_at', type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date | null;

    @Expose()
    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date | null;

    @Expose()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    createdBy: number | null;

    @Expose()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'updated_by' })
    updatedBy: number | null;

    @Expose()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'deleted_by' })
    deletedBy: number | null;

    @Expose()
    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    /**
     * @Type để khi dùng plainToInstance lên User thì cũng sẽ có tác dụng lên class Account.
     * Vì Account giữ khoá ngoại nên không cần @JoinColumn
     */
    @Expose()
    @Type(() => Account)
    @OneToOne(() => Account, Account => Account.user)
    account: Account;

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}
