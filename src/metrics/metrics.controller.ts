import { Controller, Post, Body, Res } from '@nestjs/common'; 
import { MetricsService } from './metrics.service';
import { AggregateMetricsDto } from './dto/aggregate-metrics.dto';
import * as path from 'path';
import { Response } from 'express';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Post('aggregate')
  async aggregateMetrics(@Body() aggregateMetricsDto: AggregateMetricsDto) {
    return this.metricsService.aggregateMetrics(aggregateMetricsDto);
  }

  @Post('report')
  async generateReport(@Body() aggregateMetricsDto: AggregateMetricsDto, @Res() res: Response) {
    await this.metricsService.generateReport(aggregateMetricsDto, res);
  }

  @Post('import')
  async importMetrics() {
    const filePath = path.join(__dirname, '../../src/media/METRICS_IMPORT.csv');
    await this.metricsService.importCsv(filePath);
    return { message: 'Metrics imported successfully!' };
  }
}
