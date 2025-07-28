import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, VersionColumn } from 'typeorm';

import { RefreshToken, VerifyToken } from '~/auth/entities';
import { User } from '~/user/entities';

/**
 * Account và User là liên hệ 1-1 với account là thực thể chính
 */
@Entity('accounts')
export class Account {
    @ApiProperty()
    @Expose()
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty()
    @Expose()
    @VersionColumn()
    version: number;

    @ApiProperty()
    @Expose()
    @Column()
    email: string;

    /**
     * @Column({ select: false }) chỉ có tác dụng khi lấy dữ liệu từ db,
     * còn khi insert hay update thì sẽ trả về cả giá giá trị trong db và giá trị trong đối số (có password) nên cần @Exclude để loại bỏ password.
     * Muốn kích hoạt @Exclude thì phải dùng plainToInstance để chuyển đổi từ object sang instance của class.
     */
    @ApiProperty()
    @Exclude()
    @Column()
    password: string;

    @ApiProperty()
    @Expose()
    @Column({ name: 'enable_totp', default: false, type: 'boolean' })
    enableTotp: boolean;

    @ApiProperty()
    @Expose()
    @Column({ name: 'enable_email_otp', default: false, type: 'boolean' })
    enableEmailOtp: boolean;

    @ApiProperty()
    @Expose()
    @Column({ name: 'is_credential', default: true, type: 'boolean' })
    isCredential: boolean;

    @ApiProperty()
    @Expose()
    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @ApiProperty()
    @Expose()
    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
    @Expose()
    @Column({ name: 'updated_at', type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date | null;

    @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
    @Expose()
    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date | null;

    @ApiProperty({ type: 'number', nullable: true, description: 'ID of the user who created this account' })
    @Expose()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    createdBy: number | null;

    @ApiProperty({ type: 'number', nullable: true, description: 'ID of the user who last updated this account' })
    @Expose()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'updated_by' })
    updatedBy: number | null;

    @ApiProperty({ type: 'number', nullable: true, description: 'ID of the user who deleted this account' })
    @Expose()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'deleted_by' })
    deletedBy: number | null;

    @ApiProperty({ type: () => RefreshToken })
    @Expose()
    @OneToOne(() => RefreshToken, refreshToken => refreshToken.account)
    refreshToken: RefreshToken;

    @Exclude()
    @OneToOne(() => VerifyToken, verifyToken => verifyToken.account, { cascade: true })
    verifyToken: VerifyToken;

    /**
     * @Type để khi dùng plainToInstance lên Account thì cũng sẽ có tác dụng lên class Account.
     * Account giữ khoá ngoại nên cần @JoinColumn ở đây
     * onDelete: 'CASCADE' để khi account bị xoá → user cũng xoá
     */
    @ApiProperty({ type: () => User })
    @Expose()
    @Type(() => User)
    @JoinColumn({ name: 'user_id' })
    @OneToOne(() => User, user => user.account, { cascade: true, onDelete: 'CASCADE' })
    user: User;

    constructor(partial: Partial<Account>) {
        Object.assign(this, partial);
    }
}
