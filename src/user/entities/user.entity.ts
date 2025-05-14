import { Exclude } from 'class-transformer';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { RefreshToken, VerifyToken } from '~/auth/entities';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    avatar: string;

    @Column()
    email: string;

    @Column()
    @Exclude()
    password: string;

    @Column({ default: false, type: 'boolean' })
    enableAppMFA: boolean;

    @Column({ default: true, type: 'boolean' })
    isCredential: boolean;

    /**
     * Khi xoá user thì cũng xoá luôn refresh token của user đó bằng onDelete: 'CASCADE'
     * orphanedRowAction: 'delete' để xoá orphaned row (row không có liên kết với row nào khác)
     * trong trường hợp refresh token không gắn với user nào (khó xảy ra trong trường hợp này)
     */
    @OneToOne(() => RefreshToken, refreshToken => refreshToken.user, { cascade: true, onDelete: 'CASCADE', orphanedRowAction: 'delete' })
    refreshToken: RefreshToken;

    @OneToOne(() => VerifyToken, verifyToken => verifyToken.user, { cascade: true, onDelete: 'CASCADE', orphanedRowAction: 'delete' })
    verifyToken: VerifyToken;

    /**
     * Cập nhật verifyToken và refreshToken khi cập nhật user
     */
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

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}
