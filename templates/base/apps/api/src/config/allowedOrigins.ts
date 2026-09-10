// Load the string from the environment variable, ensuring it's a non-empty string
const allowedOriginsString: string = process.env.ALLOWED_ORIGINS ?? '';

// Split the string into an array using the comma as a delimiter and trim white spaces
const allowedOrigins: string[] = allowedOriginsString
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

export default allowedOrigins;
