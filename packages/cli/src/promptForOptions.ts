import {checkbox, confirm, input, number, select} from '@inquirer/prompts';
import type {ScaffoldOption} from './define.js';

interface PromptForOptionsOptions {
  options: Record<string, ScaffoldOption>;
}

/**
 * Prompt for the value of each option interactively.
 */
export async function promptForOptions({
  options,
}: PromptForOptionsOptions): Promise<Record<string, unknown>> {
  const values: Record<string, unknown> = {};
  for (const [name, option] of Object.entries(options)) {
    values[name] = await promptForOption({name, option});
  }
  return values;
}

interface PromptForOptionOptions {
  name: string;
  option: ScaffoldOption;
}

async function promptForOption({
  name,
  option,
}: PromptForOptionOptions): Promise<unknown> {
  const message = `${option.description} (--${name})`;
  switch (option.type) {
    case 'boolean':
      return confirm({message});
    case 'number': {
      if (option.array) {
        const text = await input({
          message: `${message}, comma separated`,
          validate: (text) =>
            splitList(text).every((value) => !Number.isNaN(Number(value))) ||
            'Enter numbers separated by commas',
        });
        return splitList(text).map(Number);
      }
      return number({message, required: true});
    }
    case 'string': {
      if (option.array) {
        const text = await input({message: `${message}, comma separated`});
        return splitList(text);
      }
      return input({message, required: true});
    }
    case 'choice': {
      const choices = option.choices.map((value) => ({value}));
      return option.array
        ? checkbox({message, choices})
        : select({message, choices});
    }
  }
}

function splitList(text: string): string[] {
  return text
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value !== '');
}
