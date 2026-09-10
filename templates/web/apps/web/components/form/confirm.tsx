import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@workspace/ui/components/input-group';
import { Shield } from 'lucide-react';
import { Control, FieldValues, Path } from 'react-hook-form';

interface ConfirmFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  confirmText: string;
  placeholder?: string;
  description?: string;
  autoComplete?: string;
  required?: boolean;
}

export const ConfirmField = <T extends FieldValues>({
  control,
  name,
  label,
  confirmText,
  placeholder = `Type '${confirmText}' to confirm`,
  description,
  autoComplete = 'off',
  required = true,
}: ConfirmFieldProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className="text-primary">*</span>}
          </FormLabel>
          <FormControl>
            <InputGroup>
              <InputGroupInput
                type="text"
                placeholder={placeholder}
                autoComplete={autoComplete}
                {...field}
              />
              <InputGroupAddon align="inline-start">
                <Shield />
              </InputGroupAddon>
            </InputGroup>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
