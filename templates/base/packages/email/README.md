# @workspace/email

This package provides email features for the monorepo, including:

- Email templates built with [React Email](https://react.email/)
- Email sending via [Resend](https://resend.com/)
- Shared email configuration and types

## Usage

Import and use email utilities in your apps:

```ts
import { sendEmail } from '@workspace/email';
```

## Features

- Predefined and customizable email templates
- Type-safe email schemas
- Simple API for sending emails

## Setup

1. Configure Resend API keys in your environment variables.
2. Customize templates in [src/templates/](src/templates/) as needed.
