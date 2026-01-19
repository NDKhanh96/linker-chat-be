import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, VersionColumn } from 'typeorm';

import { Account } from '~/auth/entities';
import { ConversationMember } from '~/conversations/entities';
import { Message } from '~/messages/entities';

/**
 * Account và User là liên hệ 1-1 với account là thực thể chính
 */
@Entity('users')
export class User {
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
    @Column({ name: 'first_name' })
    firstName: string;

    @ApiProperty()
    @Expose()
    @Column({ name: 'last_name' })
    lastName: string;

    @ApiProperty()
    @Expose()
    @Column()
    avatar: string;

    @ApiProperty()
    @Expose()
    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
    @Expose()
    @Column({ name: 'updated_at', type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date | null;

    @Expose()
    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date | null;

    @ApiProperty({ type: 'number', nullable: true, description: 'ID of the user who created this user' })
    @Expose()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    createdBy: number | null;

    @ApiProperty({ type: 'number', nullable: true, description: 'ID of the user who updated this user' })
    @Expose()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'updated_by' })
    updatedBy: number | null;

    @ApiProperty({ type: 'number', nullable: true, description: 'ID of the user who deleted this user' })
    @Expose()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'deleted_by' })
    deletedBy: number | null;

    @ApiProperty()
    @Expose()
    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @OneToMany(() => Message, message => message.sender)
    messages: Message[];

    @OneToMany(() => ConversationMember, cm => cm.user)
    conversationMembers: ConversationMember[];
    /**
     * @Type để khi dùng plainToInstance lên User thì cũng sẽ có tác dụng lên class Account.
     * Vì Account giữ khoá ngoại nên không cần @JoinColumn
     */
    @ApiProperty({ type: () => Account })
    @Expose()
    @Type(() => Account)
    @OneToOne(() => Account, Account => Account.user)
    account: Account;

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}
