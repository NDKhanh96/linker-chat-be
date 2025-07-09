import { Exclude, Expose, Type } from 'class-transformer';
import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { RefreshToken, VerifyToken } from '~/auth/entities';
import { User } from '~/user/entities';

/**
 * Account và User là liên hệ 1-1 với account là thực thể chính
 */
@Entity('accounts')
export class Account {
    @Expose()
    @PrimaryGeneratedColumn()
    id: number;

    @Expose()
    @Column()
    email: string;

    /**
     * @Column({ select: false }) chỉ có tác dụng khi lấy dữ liệu từ db,
     * còn khi insert hay update thì sẽ trả về cả giá giá trị trong db và giá trị trong đối số (có password) nên cần @Exclude để loại bỏ password.
     * Muốn kích hoạt @Exclude thì phải dùng plainToInstance để chuyển đổi từ object sang instance của class.
     */
    @Exclude()
    @Column()
    password: string;

    @Expose()
    @Column({ name: 'enable_app_mfa', default: false, type: 'boolean' })
    enableAppMfa: boolean;

    @Expose()
    @Column({ name: 'is_credential', default: true, type: 'boolean' })
    isCredential: boolean;

    @Expose()
    @OneToOne(() => RefreshToken, refreshToken => refreshToken.account)
    refreshToken: RefreshToken;

    @Expose()
    @OneToOne(() => VerifyToken, verifyToken => verifyToken.account)
    verifyToken: VerifyToken;

    /**
     * @Type để khi dùng plainToInstance lên Account thì cũng sẽ có tác dụng lên class Account.
     * Account giữ khoá ngoại nên cần @JoinColumn ở đây
     * onDelete: 'CASCADE' để khi account bị xoá → user cũng xoá
     */
    @Expose()
    @Type(() => User)
    @JoinColumn()
    @OneToOne(() => User, user => user.account, { cascade: true, onDelete: 'CASCADE' })
    user: User;

    /**
     * Cập nhật verifyToken và refreshToken khi cập nhật account
     */
    @Expose()
    @BeforeInsert()
    @BeforeUpdate()
    syncVerifyToken(): void {
        if (this.verifyToken) {
            this.verifyToken.userEmail = this.email;
            this.verifyToken.userId = this.id;
        }

        if (this.refreshToken) {
            this.refreshToken.userId = this.id;
        }
    }

    constructor(partial: Partial<Account>) {
        Object.assign(this, partial);
    }
}
