import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import cron from 'node-cron';
import { differenceInCalendarDays } from 'date-fns';

@Injectable()
export class ReminderService implements OnModuleInit {
  private readonly logger = new Logger(ReminderService.name);
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // run every day at 00:00
    cron.schedule('0 0 * * *', () => this.handleCron());
  }

  private async handleCron() {
    const reminders = await this.prisma.filingReminder.findMany({ where: { completed: false } });
    const today = new Date();
    for (const r of reminders) {
      const diff = differenceInCalendarDays(r.dueDate, today);
      if ([60, 30, 7].includes(diff)) {
        this.logger.log(`Reminder: Company ${r.companyId} filing ${r.type} due in ${diff} days`);
      }
    }
  }
}
