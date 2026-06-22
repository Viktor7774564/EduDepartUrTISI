import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Group } from './group.entity';

@Entity('directions')
export class Direction {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    code!: string;

    @Column()
    name!: string;

    @OneToMany(() => Group, (group) => group.direction)
    groups!: Group[];
}