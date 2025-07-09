import { Expose, Type } from 'class-transformer';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

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
    @Column({ name: 'first_name' })
    firstName: string;

    @Expose()
    @Column({ name: 'last_name' })
    lastName: string;

    @Expose()
    @Column()
    avatar: string;

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
