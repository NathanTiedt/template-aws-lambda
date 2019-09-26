const { src, dest, series } = require('gulp');
const { join, resolve } = require('path');
const clean = require('gulp-clean');
const fs = require('fs');
const install = require('gulp-install');
const program = require('commander');
const replace = require('gulp-replace');
const ts = require('gulp-typescript');

const NO_NAME = 'NONE';

function cleanBuild() {
  return src('./build/**/*', {read: false})
    .pipe(clean());
}

function startLambdaFunction() {
  program
    .option('-n, --name <lambda-name>', 'Name of Lambda Function', NO_NAME)
    .option('-d, --desc <description>', 'Description of Lambda', '');
  program.parse(process.argv);
  if (program.name === 'NONE')
    throw new Error('No Name Given');
  return src('./.template/*')
    .pipe(replace('lambda_function_name', program.name))
    .pipe(replace('lambda_function_description', program.desc))
    .pipe(dest(`./${program.name}/`));
}

function packageFunction(lambda) {
  const tsProject = ts.createProject(`./${lambda}/tsconfig.json`);
  return Promise.resolve(
    tsProject.src()
      .pipe(tsProject())
      .pipe(dest(`./build/${lambda}`))
  );
}

function packageLambdas(done) {
  let lambdas = Promise.all(
    fs.readdirSync('./')
      .filter( (dir) => {
        return dir !== '.template'
            && fs.existsSync(join(dir, 'package.json'));
      })
      .map( (lambda) => {
        return packageFunction(lambda);
      })
  );
  return lambdas;
}

exports.create = startLambdaFunction;
exports.package = series(cleanBuild, packageLambdas);
