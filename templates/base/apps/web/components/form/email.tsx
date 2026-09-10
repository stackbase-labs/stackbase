import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@workspace/ui/components/input-group';
import { Mail } from 'lucide-react';
import { ReactNode } from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';

interface EmailFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: ReactNode | string;
  autoComplete?: string;
  required?: boolean;
}

export const EmailField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'yourname@example.com',
  description,
  autoComplete = 'email',
  required = true,
}: EmailFieldProps<T>) => {
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
                type="email"
                placeholder={placeholder}
                autoComplete={autoComplete}
                {...field}
              />
              <InputGroupAddon align="inline-start">
                <Mail />
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
