import {type Scaffold, json, pipe, when} from '@buildscaffold/core';
import {template} from '@buildscaffold/ejs';

export const licenses = ['MIT', 'ISC'] as const;

interface LicenseOptions {
  author: string;
  license: (typeof licenses)[number];
}

/**
 * A scaffold which writes a LICENSE file and sets the license in package.json.
 */
export function license({author, license}: LicenseOptions): Scaffold {
  return pipe(
    template(new URL(`../templates/license/${license}`, import.meta.url), {
      author,
      year: new Date().getFullYear(),
    }),
    when(
      (files) => files.has('package.json'),
      json.merge('package.json', {license}),
    ),
  );
}
