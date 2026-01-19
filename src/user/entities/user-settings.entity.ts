import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { User } from '~/user/entities';

@Entity('user_settings')
export class UserSettings {
    @PrimaryColumn({ name: 'user_id', type: 'bigint' })
    userId: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ default: 'light' })
    theme: string;

    @Column({ length: 10, default: 'vi' })
    language: string;

    @Column({ name: 'notify_enabled', default: true })
    notifyEnabled: boolean;
}
