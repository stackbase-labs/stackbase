import type { z } from 'zod';
import type { ToolDefinitionOptions } from './types';

export interface DefinedTool<TInput extends z.ZodType, TOutput> {
  description: string;
  inputSchema: TInput;
  execute: (input: z.infer<TInput>) => Promise<TOutput>;
}

export const defineTool = <TInput extends z.ZodType, TOutput>(
  options: ToolDefinitionOptions<TInput, TOutput>,
): DefinedTool<TInput, TOutput> => {
  return {
    description: options.description,
    inputSchema: options.inputSchema,
    execute: async (rawInput: z.infer<TInput>): Promise<TOutput> => {
      const parsed = options.inputSchema.parse(rawInput);
      return await options.execute(parsed);
    },
  };
};
