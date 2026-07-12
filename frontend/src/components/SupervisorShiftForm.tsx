import { CalendarDays, Gauge, Hash, Package, ToyBrick } from 'lucide-react';
import type { SupervisorShiftForm as SupervisorShiftFormType } from '../types/production';
import { SelectField, TextField } from './ui/Field';

interface SupervisorShiftFormProps {
  form: SupervisorShiftFormType;
  onChange: (field: keyof SupervisorShiftFormType, value: string) => void;
}

const SupervisorShiftForm = ({ form, onChange }: SupervisorShiftFormProps) => (
  <section>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <TextField
        label="Date"
        icon={<CalendarDays size={15} />}
        type="date"
        value={form.date}
        onChange={(event) => onChange('date', event.target.value)}
      />

      <SelectField
        label="Shift"
        icon={<Gauge size={15} />}
        value={form.shift}
        onChange={(event) => onChange('shift', event.target.value)}
      >
        <option value="A">Shift 1 - Hourly</option>
        <option value="B">Shift 2 - Hourly</option>
        <option value="C">Shift 3 - Direct Total</option>
      </SelectField>

      <TextField
        label="Machine"
        icon={<Hash size={15} />}
        value={form.machineNo}
        onChange={(event) => onChange('machineNo', event.target.value)}
        placeholder="M-03"
      />

      <TextField
        label="Toy Code"
        icon={<ToyBrick size={15} />}
        value={form.toyCode}
        onChange={(event) => onChange('toyCode', event.target.value.toUpperCase())}
        placeholder="TY-104"
      />

      <TextField
        label="Target Pieces"
        icon={<Package size={15} />}
        inputMode="numeric"
        value={form.targetPieces}
        onChange={(event) => onChange('targetPieces', event.target.value.replace(/\D/g, ''))}
        placeholder="2500"
      />
    </div>
  </section>
);

export default SupervisorShiftForm;
