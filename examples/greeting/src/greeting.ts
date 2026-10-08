import {git, npm, serial} from '@buildscaffold/task';
import {json, merge, pipe, when, write} from '@buildscaffold/core';
import {defineScaffold} from '@buildscaffold/cli/define';

export default defineScaffold({
  description: 'Greets someone by name',
  options: {name: {type: 'string', description: 'Who to greet'}},
  scaffold: ({name}) =>
    pipe(
      merge(new URL('../files', import.meta.url)),
      write('greeting.txt', `Hello ${name}!`),
      // writing a package.json scopes npm install to the scaffolded directory
      json.merge('package.json', {name: 'greeting', private: true}),
      when(
        (files) => !files.has('README.md'),
        write('README.md', `# Greeting for ${name}\n`),
      ),
    ),
  tasks: () => serial([npm.install(), git.init()]),
});
