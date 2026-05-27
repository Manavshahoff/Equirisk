import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export interface ColumnDef<T> {
  key: keyof T & string;
  label: string;
  type?: "text" | "number" | "date" | "select";
  options?: { value: string; label: string }[];
  width?: string;
}

interface Props<T> {
  title?: string;
  rows: T[];
  columns: ColumnDef<T>[];
  selected: Set<number>;
  onSelectedChange: (s: Set<number>) => void;
  onChange: (rows: T[]) => void;
  newRow: () => T;
  addLabel?: string;
  onRemoveSelected?: () => void;
}

export function EditableTable<T>({
  title,
  rows,
  columns,
  selected,
  onSelectedChange,
  onChange,
  newRow,
  addLabel = "Add Row",
  onRemoveSelected,
}: Props<T>) {
  const updateCell = (idx: number, key: string, value: unknown) => {
    const next = rows.slice();
    next[idx] = { ...next[idx], [key]: value };
    onChange(next);
  };

  const addRow = () => onChange([...rows, newRow()]);

  const removeSelected = () => {
    if (onRemoveSelected) {
      onRemoveSelected();
      return;
    }

    onChange(rows.filter((_, index) => !selected.has(index)));
    onSelectedChange(new Set());
  };

  const toggle = (i: number) => {
    const s = new Set(selected);
    if (s.has(i)) s.delete(i);
    else s.add(i);
    onSelectedChange(s);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {title && <div className="text-sm font-medium">{title}</div>}
        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={addRow}>
            <Plus className="h-3.5 w-3.5 mr-1" /> {addLabel}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={removeSelected}
            disabled={selected.size === 0}
            className="text-negative hover:text-negative"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove Selected
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-secondary/40">
            <tr>
              <th className="w-10 px-3 py-2 text-left">
                <Checkbox
                  checked={rows.length > 0 && selected.size === rows.length}
                  onCheckedChange={(c) =>
                    onSelectedChange(c ? new Set(rows.map((_, i) => i)) : new Set())
                  }
                />
              </th>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-3 py-2 text-left font-medium text-muted-foreground uppercase tracking-wider"
                  style={{ width: c.width }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-t border-border hover:bg-secondary/20 transition-colors"
              >
                <td className="px-3 py-1.5">
                  <Checkbox checked={selected.has(i)} onCheckedChange={() => toggle(i)} />
                </td>
                {columns.map((c) => {
                  const val = row[c.key];
                  if (c.type === "select") {
                    return (
                      <td key={c.key} className="px-2 py-1.5">
                        <Select
                          value={String(val ?? "")}
                          onValueChange={(v) => updateCell(i, c.key, v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {c.options?.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    );
                  }
                  return (
                    <td key={c.key} className="px-2 py-1.5">
                      <Input
                        className="h-8 text-xs tabular-nums"
                        type={c.type === "number" ? "number" : c.type === "date" ? "date" : "text"}
                        value={String(val ?? "")}
                        onChange={(e) =>
                          updateCell(
                            i,
                            c.key,
                            c.type === "number" ? Number(e.target.value) : e.target.value,
                          )
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No rows. Click "{addLabel}" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
