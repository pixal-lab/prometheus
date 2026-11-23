import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { ClassBlock } from '../../../core/types/calendar.types';

dayjs.extend(isoWeek);

export function expandRecurringEvents(blocks: ClassBlock[], startDate: string, endDate: string): ClassBlock[] {
  const result: ClassBlock[] = [];
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  blocks.forEach(block => {
    // Si no es recurrente, añadir directamente si cae en rango
    if (!block.isRecurring || !block.recurrenceRule) {
      const blockDate = dayjs(block.date);
      if (blockDate.isAfter(start.subtract(1, 'day')) && blockDate.isBefore(end.add(1, 'day'))) {
        result.push(block);
      }
      return;
    }

    const rule = block.recurrenceRule;
    const originDate = dayjs(block.date);
    const maxOccurrences = rule.ends === 'afterOccurrences' ? (rule.occurrences || 10) : 200;
    const ruleEndDate = rule.ends === 'onDate' && rule.endDate ? dayjs(rule.endDate) : end;
    let count = 0;

    if (rule.type === 'weekly') {
      const activeDays = (rule.days && rule.days.length > 0)
        ? [...rule.days].sort((a, b) => a - b)
        : [originDate.isoWeekday()];

      let weekMonday = originDate.startOf('isoWeek');
      let safetyCount = 0;

      while (count < maxOccurrences && safetyCount < 300) {
        for (const targetDay of activeDays) {
          const occDate = weekMonday.add(targetDay - 1, 'day');

          if (occDate.isBefore(originDate, 'day')) {
            continue; // No generar fechas anteriores al evento original
          }

          if (rule.ends === 'onDate' && occDate.isAfter(ruleEndDate, 'day')) {
            return;
          }

          if (occDate.isAfter(end, 'day')) {
            return;
          }

          if (count >= maxOccurrences) {
            return;
          }

          if (occDate.isAfter(start.subtract(1, 'day')) && occDate.isBefore(end.add(1, 'day'))) {
            result.push({
              ...block,
              id: occDate.isSame(originDate, 'day') ? block.id : `${block.id}-rec-${count}`,
              date: occDate.format('YYYY-MM-DD'),
            });
          }
          count++;
        }
        weekMonday = weekMonday.add(1, 'week');
        safetyCount++;
      }
    } else {
      let current = originDate;
      while (
        count < maxOccurrences &&
        (current.isBefore(ruleEndDate) || current.isSame(ruleEndDate, 'day')) &&
        (current.isBefore(end) || current.isSame(end, 'day'))
      ) {
        if (current.isAfter(start.subtract(1, 'day'))) {
          result.push({
            ...block,
            id: count === 0 ? block.id : `${block.id}-rec-${count}`,
            date: current.format('YYYY-MM-DD'),
          });
        }

        count++;
        if (rule.type === 'daily') {
          current = current.add(1, 'day');
        } else if (rule.type === 'monthly') {
          current = current.add(1, 'month');
        } else if (rule.type === 'yearly') {
          current = current.add(1, 'year');
        } else {
          break;
        }
      }
    }
  });

  return result;
}

