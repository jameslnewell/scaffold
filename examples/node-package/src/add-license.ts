import {license, licenses} from './license.js';
import {defineScaffold} from '@buildscaffold/cli/define';

export default defineScaffold({
  description: 'Adds a license to a package',
  options: {
    author: {type: 'string', description: 'The copyright holder'},
    license: {type: 'choice', description: 'The license', choices: licenses},
  },
  scaffold: (options) => license(options),
});
