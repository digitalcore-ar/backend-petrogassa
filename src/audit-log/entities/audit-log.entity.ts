import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'table_name' })
    tableName: string;

    @Column({ name: 'record_id' })
    recordId: string;

    //CREATE, UPDATE, DELETE
    @Column()
    action: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'jsonb', nullable: true, name: 'new_values' })
    newValues: any;

    @Column({ nullable: true, name: 'ip_address' })
    ipAddress: string;

    @Column({ nullable: true, name: 'user_agent' })
    userAgent: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

}
