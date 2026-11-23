import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { DayType, DayTypeInfo } from '../../../core/types/calendar.types';
import { useCalendarStore } from '../store/useCalendarStore';
import { useTranslation } from '../../../core/i18n/useTranslation';
import { Calendar, Trash2, Plus, Check } from 'lucide-react';

interface DayTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD
}

export const DayTypeModal: React.FC<DayTypeModalProps> = ({ isOpen, onClose, date }) => {
  const { t } = useTranslation();
  const { calendarDayTypes, setDayType, dayColorPalette, addDayColor, deleteDayColor } = useCalendarStore();

  const currentInfo = calendarDayTypes[date];
  const [selectedColor, setSelectedColor] = useState<string | null>(currentInfo?.color || null);
  const [selectedLabel, setSelectedLabel] = useState<string>(currentInfo?.note || '');
  const [note, setNote] = useState<string>(currentInfo?.note || '');

  // Add new color state
  const [isAddingColor, setIsAddingColor] = useState(false);
  const [newColorHex, setNewColorHex] = useState('#e67e22');
  const [newColorLabel, setNewColorLabel] = useState('');

  useEffect(() => {
    const info = calendarDayTypes[date];
    setSelectedColor(info?.color || null);
    setSelectedLabel(info?.note || '');
    setNote(info?.note || '');
    setIsAddingColor(false);
  }, [date, calendarDayTypes, isOpen]);

  const handleSelectPaletteItem = (color: string, label: string) => {
    if (selectedColor === color) {
      setSelectedColor(null);
      if (note === label) setNote('');
    } else {
      setSelectedColor(color);
      setSelectedLabel(label);
      if (!note.trim()) {
        setNote(label);
      }
    }
  };

  const handleAddNewColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorLabel.trim()) return;
    await addDayColor(newColorHex, newColorLabel.trim());
    setSelectedColor(newColorHex);
    setSelectedLabel(newColorLabel.trim());
    if (!note.trim()) setNote(newColorLabel.trim());
    setNewColorLabel('');
    setIsAddingColor(false);
  };

  const handleSave = async () => {
    if (!selectedColor && !note.trim()) {
      await setDayType(date, null);
    } else {
      await setDayType(date, {
        date,
        type: 'custom',
        color: selectedColor || undefined,
        note: note.trim(),
      });
    }
    onClose();
  };

  const handleClear = async () => {
    await setDayType(date, null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${t('day_settings_title')} (${date})`} maxWidth="md">
      <div className="flex flex-col gap-5">
        {/* Color Palette Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('day_color_type')}
            </label>
            <button
              type="button"
              onClick={() => setIsAddingColor(prev => !prev)}
              className="text-xs text-orange-600 dark:text-orange-400 font-bold hover:underline"
            >
              {isAddingColor ? t('cancel') : t('add_color_btn')}
            </button>
          </div>

          {/* Form to add custom color */}
          {isAddingColor && (
            <form onSubmit={handleAddNewColor} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <input
                type="color"
                value={newColorHex}
                onChange={e => setNewColorHex(e.target.value)}
                className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent shrink-0"
              />
              <input
                type="text"
                placeholder={t('day_name_placeholder')}
                value={newColorLabel}
                onChange={e => setNewColorLabel(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                required
              />
              <Button type="submit" variant="primary" size="sm">
                {t('save')}
              </Button>
            </form>
          )}

          {/* Palette Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {dayColorPalette.map((opt, idx) => {
              const isSelected = selectedColor === opt.color;
              return (
                <div
                  key={`${opt.color}-${idx}`}
                  onClick={() => handleSelectPaletteItem(opt.color, opt.label)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/40 shadow-xs ring-1 ring-orange-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {opt.label}
                    </span>
                  </div>

                  {idx >= 4 && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        deleteDayColor(idx);
                        if (selectedColor === opt.color) setSelectedColor(null);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Eliminar este color de la paleta"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Note Input */}
        <Input
          label={t('add_day_note')}
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={t('day_name_placeholder')}
        />

        {/* Footer Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="text-rose-600">
            <Trash2 size={15} /> {t('clear_day_type')}
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleSave}>
              {t('save')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

