import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function DynamicSpecFields({ fields, append, remove, register, errors }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-gray-800">
            Technical Specifications (Optional)
          </label>
          <p className="text-xs text-gray-500">
            Add dynamic attribute pairs like RAM, Color, or Material.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ key: "", value: "" })}
          className="flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Field
        </Button>
      </div>

      {fields.length === 0 && (
        <div className="p-4 border border-dashed border-gray-200 rounded-lg text-center text-xs text-gray-400">
          No custom specs added yet. Click &quot;Add Field&quot; to define custom traits.
        </div>
      )}

      {fields.map((field, index) => {
        const keyError = errors?.specifications?.[index]?.key;
        const valError = errors?.specifications?.[index]?.value;

        return (
          <div key={field.id} className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                placeholder="Spec Key (e.g., Color)"
                {...register(`specifications.${index}.key`)}
                className={keyError ? "border-red-500" : ""}
                aria-label={`Specification key ${index + 1}`}
              />
              {keyError && (
                <p className="text-[11px] text-red-500 mt-1">{keyError.message}</p>
              )}
            </div>

            <div className="flex-1">
              <Input
                placeholder="Value (e.g., Navy Blue)"
                {...register(`specifications.${index}.value`)}
                className={valError ? "border-red-500" : ""}
                aria-label={`Specification value ${index + 1}`}
              />
              {valError && (
                <p className="text-[11px] text-red-500 mt-1">{valError.message}</p>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              className="text-gray-400 hover:text-red-500 mt-0.5"
              aria-label={`Remove specification ${index + 1}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}