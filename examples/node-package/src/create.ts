import {license, licenses} from './license.js';
import {move, pipe} from '@buildscaffold/core';
import {defineScaffold} from '@buildscaffold/cli/define';
import {git} from '@buildscaffold/task';
import {template} from '@buildscaffold/ejs';

export default defineScaffold({
  description: 'Creates a Node.js package with a license',
  options: {
    name: {type: 'string', description: 'The name of the package'},
    author: {type: 'string', description: 'The author of the package'},
    license: {
      type: 'choice',
      description: 'The license, defaults to MIT',
      choices: licenses,
      optional: true,
    },
  },
  scaffold: ({name, author, license: licenseName = 'MIT'}) =>
    pipe(
      template(new URL('../templates/create', import.meta.url), {
        name,
        author,
      }),
      // npm leaves .gitignore files out of published packages, so the template is named without the dot
      move('gitignore', '.gitignore'),
      license({author, license: licenseName}),
    ),
  tasks: () => git.init(),
});
