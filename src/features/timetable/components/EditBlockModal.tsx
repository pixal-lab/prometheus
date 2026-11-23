import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { TimetableEvent, DayOfWeek, TimetableBlockType } from '../../../core/types/timetable.types';
import { useTimetableStore } from '../store/useTimetableStore';
import { useTranslation } from '../../../core/i18n/useTranslation';
import { useDialog } from '../../../components/ui/Dialog';
import { useToast } from '../../../components/ui/Toast';

interface EditBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayOfWeek;
  event: TimetableEvent | null;
}

export const EditBlockModal: React.FC<EditBlockModalProps> = ({ isOpen, onClose, day, event }) => {
  const { t } = useTranslation();
  const { updateEvent, deleteEvent, duplicateEvent } = useTimetableStore();
  const { confirm } = useDialog();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:30');
  const [color, setColor] = useState('#1abc9c');
  const [type, setType] = useState<TimetableBlockType>('course');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setStartTime(event.startTime);
      setEndTime(event.endTime);
      setColor(event.color);
      setType(event.type);
      setNotes(event.notes || '');
    }
  }, [event]);

  if (!event) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateEvent(day, event.id, {
      title,
      startTime,
      endTime,
      color,
      type,
      notes,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (!event) return;
    const confirmed = await confirm({
      title: 'Eliminar Bloque',
      message: `¿Deseas eliminar el bloque "${title}" del horario?`,
      confirmText: 'Eliminar Bloque',
      variant: 'danger',
      icon: 'trash',
    });
    if (confirmed) {
      await deleteEvent(day, event.id);
      showToast(`Bloque "${title}" eliminado`, 'info');
      onClose();
    }
  };

  const handleDuplicate = async () => {
    await duplicateEvent(day, event.id);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Bloque de Horario">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input
          label="Título del Bloque"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Hora de Inicio"
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            required
          />
          <Input
            label="Hora de Fin"
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Tipo de Bloque"
            value={type}
            onChange={e => setType(e.target.value as TimetableBlockType)}
            options={[
              { value: 'course', label: 'Asignatura / Curso' },
              { value: 'break', label: 'Recreo' },
              { value: 'lunch', label: 'Almuerzo' },
              { value: 'planning', label: 'Planificación' },
              { value: 'special', label: 'Especial' },
            ]}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-10 h-9 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-900"
              />
              <span className="text-xs font-mono text-slate-500">{color}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Notas
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Información adicional del bloque..."
            className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
              {t('delete')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleDuplicate}>
              {t('duplicate')}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {t('save')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

