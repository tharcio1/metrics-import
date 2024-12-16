import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Metric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  metric_id: string;

  @Column('float')
  value: number;

  @Column('timestamptz')
  datetime: Date;
}
