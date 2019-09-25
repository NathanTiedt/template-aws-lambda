const { src, dest } = require('gulp');
const replace = require('gulp-replace');
const program = require('commander');

function startNewLambda() {
  program
    .option('-n, --name <lambda-name>', 'Name of Lambda Function')
    .option('-d, --desc <description>', 'Description of Lambda', '');
  program.parse(process.argv);
  return src('./.template/*')
    .pipe(replace('lambda_function_name', program.name))
    .pipe(replace('lambda_function_description', program.desc))
    .pipe(dest(`./${program.name}/`));
}

exports.create = startNewLambda;
