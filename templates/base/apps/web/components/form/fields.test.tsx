import { ConfirmField, EmailField, NameField, PasswordField } from '@/components/form';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from '@workspace/ui/components/form';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

type Values = {
  name: string;
  email: string;
  password: string;
  confirmation: string;
};

function TestFormFields() {
  const form = useForm<Values>({
    defaultValues: { name: '', email: '', password: '', confirmation: '' },
  });

  return (
    <Form {...form}>
      <form>
        <NameField control={form.control} name="name" label="Name" />
        <EmailField control={form.control} name="email" label="Email" />
        <PasswordField control={form.control} name="password" label="Password" />
        <ConfirmField
          control={form.control}
          name="confirmation"
          label="Confirm"
          confirmText="DELETE"
        />
      </form>
    </Form>
  );
}

describe('Form Fields (NameField, EmailField, PasswordField, ConfirmField)', () => {
  it('renders all common form fields', () => {
    render(<TestFormFields />);

    expect(screen.getByPlaceholderText(/enter name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/yourname@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type 'delete' to confirm/i)).toBeInTheDocument();
  });

  it('supports editing field values', async () => {
    const user = userEvent.setup();
    render(<TestFormFields />);

    const nameInput = screen.getByPlaceholderText(/enter name/i);
    const emailInput = screen.getByPlaceholderText(/yourname@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/enter password/i);
    const confirmInput = screen.getByPlaceholderText(/type 'delete' to confirm/i);

    await user.type(nameInput, 'Vijay Singh');
    await user.type(emailInput, 'vijay@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmInput, 'DELETE');

    expect(nameInput).toHaveValue('Vijay Singh');
    expect(emailInput).toHaveValue('vijay@example.com');
    expect(passwordInput).toHaveValue('password123');
    expect(confirmInput).toHaveValue('DELETE');
  });
});
