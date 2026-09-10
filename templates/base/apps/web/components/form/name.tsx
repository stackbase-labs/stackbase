import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@workspace/ui/components/input-group';
import { User } from 'lucide-react';
import { ReactNode } from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';

interface NameFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: ReactNode | string;
  autoComplete?: string;
  required?: boolean;
}

export const NameField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Enter name',
  description,
  autoComplete = 'name',
  required = true,
}: NameFieldProps<T>) => {
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
                <User />
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
