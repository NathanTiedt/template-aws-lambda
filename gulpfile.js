const { src, dest, series } = require('gulp');
const { join, resolve } = require('path');
const clean = require('gulp-clean');
const fs = require('fs');
const install = require('gulp-install');
const mergeStream = require('merge-stream');
const program = require('commander');
const replace = require('gulp-replace');
const ts = require('gulp-typescript');
const zip = require('gulp-zip');

const BUILD_DIR = `./build`;
const NO_NAME = 'NONE';

function cleanBuild() {
  return src('./build/*', {read: false})
    .pipe(clean());
}

function cleanPackageJsons() {
  return Promise.all(
    findLambdas()
      .map( (lambda) => {
        return Promise.resolve(
          src([`${BUILD_DIR}/${lambda}/package.json`,
              `${BUILD_DIR}/${lambda}/package-lock.json`])
            .pipe(clean())
        )
      })
  );
}

function findLambdas() {
  return fs.readdirSync('./')
    .filter( (dir) => {
      return dir !== '.template'
          && fs.existsSync(join(dir, 'package.json'));
    });
}

function installNodeDev() {
  src(`./package.json`)
    .pipe(install());
  return Promise.all(
    findLambdas()
      .map( (lambda) => {
        src(`./${lambda}/package.json`)
          .pipe(install())
      })
  )
}

function installNodeProduction() {
  let merge = mergeStream();
    findLambdas()
      .map( (lambda) => {
          merge.add(src(`./${lambda}/package.json`)
            .pipe(dest(`${BUILD_DIR}/${lambda}`))
            .pipe(install({npm: `--production --save false`})))
      })
  return merge;
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

function typescriptFunction(lambda) {
  const tsProject = ts.createProject(`./${lambda}/tsconfig.json`);
  return Promise.resolve(
    tsProject.src()
      .pipe(tsProject())
      .pipe(dest(`${BUILD_DIR}/${lambda}`))
  );
}

function typescriptLambdas(done) {
  let lambdas = Promise.all(
    findLambdas()
      .map( (lambda) => {
        return typescriptFunction(lambda);
      })
  );
  return lambdas;
}

function zipLambdas() {
  return Promise.all(
    findLambdas()
      .map( (lambda) => {
        return Promise.resolve(
          src(`${BUILD_DIR}/${lambda}/*`)
            .pipe(zip(`${lambda}.zip`))
            .pipe(dest(`artifacts`))
        )
      })
  );
}

exports.create = startLambdaFunction;
exports.install = installNodeDev;
exports.package = series(
  cleanBuild, 
  typescriptLambdas, 
  installNodeProduction,
  zipLambdas
);
