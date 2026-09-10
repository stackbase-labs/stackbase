import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@workspace/ui/components/input-group';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';

interface PasswordFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: ReactNode | string;
  autoComplete?: string;
  required?: boolean;
}

export const PasswordField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Enter password',
  description,
  autoComplete = 'current-password',
  required = true,
}: PasswordFieldProps<T>) => {
  const [show, setShow] = useState(false);

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
                type={show ? 'text' : 'password'}
                placeholder={placeholder}
                autoComplete={autoComplete}
                {...field}
              />
              <InputGroupAddon align="inline-start">
                <Lock />
              </InputGroupAddon>
              <InputGroupAddon align="inline-end" onClick={() => setShow(!show)}>
                {show ? <EyeOff /> : <Eye />}
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
