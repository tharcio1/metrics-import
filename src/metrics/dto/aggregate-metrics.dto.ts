import { IsString, IsNumber, IsDateString } from 'class-validator';

export class AggregateMetricsDto {
  @IsNumber()
  metricId: number;

  @IsString()
  aggType: string;

  @IsDateString()
  dateInitial: string;

  @IsDateString()
  finalDate: string;
}
