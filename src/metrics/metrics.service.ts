import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Metric } from './entities/metric.entity';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import * as dayjs from 'dayjs';
import { AggregateMetricsDto } from './dto/aggregate-metrics.dto';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(Metric)
    private readonly metricRepository: Repository<Metric>,
  ) {}

  async generateReport(aggregateMetricsDto: AggregateMetricsDto, res: Response): Promise<void> {
    const { metricId, dateInitial, finalDate, aggType } = aggregateMetricsDto;

    const startDate = dayjs(dateInitial).startOf('day').toDate();
    const endDate = dayjs(finalDate).endOf('day').toDate();

    const metrics = await this.metricRepository
      .createQueryBuilder('metric')
      .where('metric.metric_id = :metricId', { metricId })
      .andWhere('metric.datetime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();

    const aggregatedData = this.aggregateData(metrics, aggType);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Metrics Report');

    worksheet.columns = [
      { header: 'metricId', key: 'metricId' },
      { header: 'DateTime', key: 'dateTime' },
      { header: 'AggDay', key: 'aggDay' },
      { header: 'AggMonth', key: 'aggMonth' },
      { header: 'AggYear', key: 'aggYear' },
    ];

    aggregatedData.forEach((data) => {
      const aggMonth = this.aggregateDataForMonth(metrics, data.date);
      const aggYear = this.aggregateDataForYear(metrics, data.date);

      worksheet.addRow({
        metricId,
        dateTime: dayjs(data.date).format('DD/MM/YYYY'),
        aggDay: data.value,
        aggMonth: aggMonth,
        aggYear: aggYear,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=metrics_report.xlsx',
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async aggregateMetrics(aggregateMetricsDto: AggregateMetricsDto): Promise<any[]> {
    const { metricId, aggType, dateInitial, finalDate } = aggregateMetricsDto;
  
    const startDate = dayjs(dateInitial).startOf('day').toDate();
    const endDate = dayjs(finalDate).endOf('day').toDate();
  
    let groupBy: string;
    switch (aggType) {
      case 'DAY':
        groupBy = 'DAY';
        break;
      case 'MONTH':
        groupBy = 'MONTH';
        break;
      case 'YEAR':
        groupBy = 'YEAR';
        break;
      default:
        throw new Error('Invalid aggregation type');
    }
  
    const rawResults = await this.metricRepository
      .createQueryBuilder('metric')
      .select([
        'DATE_TRUNC(:groupBy, metric.datetime) AS date',
        'SUM(metric.value) AS value',
      ])
      .setParameter('groupBy', groupBy)
      .where('metric.metric_id = :metricId', { metricId })
      .andWhere('metric.datetime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE_TRUNC(:groupBy, metric.datetime)')
      .orderBy('date', 'ASC')
      .getRawMany();
  
    return rawResults.map((result) => ({
      date: dayjs(result.date).format('YYYY-MM-DD'),
      value: parseFloat(result.value),
    }));
  }

  private aggregateData(metrics: Metric[], aggType: string): any[] {
    const aggregatedData = [];
    const groupedMetrics = this.groupMetricsByTime(metrics, aggType);

    groupedMetrics.forEach((group) => {
      const aggregatedValue = this.calculateAggregation(group, aggType);
      aggregatedData.push({
        date: group[0].datetime,
        value: aggregatedValue,
      });
    });

    return aggregatedData;
  }

  private groupMetricsByTime(metrics: Metric[], aggType: string): Metric[][] {
    const groups = [];
    metrics.forEach((metric) => {
      let groupKey: string;
      switch (aggType) {
        case 'DAY':
          groupKey = dayjs(metric.datetime).format('YYYY-MM-DD');
          break;
        case 'MONTH':
          groupKey = dayjs(metric.datetime).format('YYYY-MM');
          break;
        case 'YEAR':
          groupKey = dayjs(metric.datetime).format('YYYY');
          break;
        default:
          groupKey = '';
      }
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(metric);
    });
    return Object.values(groups);
  }

  private calculateAggregation(group: Metric[], aggType: string): number {
    switch (aggType) {
      case 'DAY':
        return group.reduce((sum, metric) => sum + metric.value, 0);
      case 'MONTH':
        return group.reduce((sum, metric) => sum + metric.value, 0);
      case 'YEAR':
        return group.reduce((sum, metric) => sum + metric.value, 0);
      default:
        return 0;
    }
  }

  private aggregateDataForMonth(metrics: any[], date: Date): number {
    const month = dayjs(date).month();
    const monthMetrics = metrics.filter(metric =>
      dayjs(metric.datetime).month() === month
    );
    return monthMetrics.reduce((acc, metric) => acc + metric.value, 0);
  }

  private aggregateDataForYear(metrics: any[], date: Date): number {
    const year = dayjs(date).year();
    const yearMetrics = metrics.filter(metric =>
      dayjs(metric.datetime).year() === year
    );
    return yearMetrics.reduce((acc, metric) => acc + metric.value, 0);
  }

  async importCsv(filePath: string): Promise<void> {
    const metrics: Metric[] = [];
    const batchSize = 1000;

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(
          csvParser({
            separator: ';',
          }).on('headers', (headers) => {
            headers.forEach((header, index) => {
              headers[index] = header.replace(/"/g, '').trim();
            });
          }),
        )
        .on('data', (row) => {
          const metricId = row['metricId'];
          const dateTimeStr = row['dateTime'];
          const value = row['value'];
        
          if (!metricId || !dateTimeStr || !value) {
            console.warn(`Incomplete row detected: ${metricId} , ${dateTimeStr}, ${value}`);
            return; 
          }
        
          const datetime = this.parseDateTime(dateTimeStr);
          if (!datetime || isNaN(datetime.getTime())) {
            console.warn(`Invalid date format: ${dateTimeStr}`);
            return;
          }
        
          const numericValue = parseFloat(value);
          if (isNaN(numericValue)) {
            console.warn(`Invalid value: ${value}`);
            return;
          }
        
          const metric = new Metric();
          metric.metric_id = metricId;
          metric.datetime = datetime;
          metric.value = numericValue;
        
          metrics.push(metric);
        })
        .on('end', async () => {
          console.log(`Total valid metrics parsed: ${metrics.length}`);
        
          try {
            for (let i = 0; i < metrics.length; i += batchSize) {
              const batch = metrics.slice(i, i + batchSize);
              await this.metricRepository.save(batch);
            }
            console.log('CSV import completed successfully!');
            resolve();
          } catch (error) {
            console.error('Error saving metrics:', error);
            reject(error);
          }
        })
        
        .on('error', (error) => reject(error));
    });
  }

  private parseDateTime(dateTimeStr: string): Date {
    try {
      const [datePart, timePart] = dateTimeStr.split(' ');
      const [day, month, year] = datePart.split('/').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);

      if (year && month && day && hour !== undefined && minute !== undefined) {
        return new Date(year, month - 1, day, hour, minute);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
