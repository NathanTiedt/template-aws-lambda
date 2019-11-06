const { src, dest, series, parallel } = require('gulp');
const { join, resolve } = require('path');
const clean = require('gulp-clean');
const fs = require('fs');
const install = require('gulp-install');
const mergeStream = require('merge-stream');
const program = require('commander');
const replace = require('gulp-replace');
const ts = require('gulp-typescript');
const zip = require('gulp-zip');

const ARTIFACTS = `./artifacts`;
const BUILD_DIR = `./build`;
const NO_NAME = 'NONE';

function cleanBuild() {
  return mergeStream(
    src(`${BUILD_DIR}/*`, {read: false})
      .pipe(clean()),
    src(`${ARTIFACTS}/*`, {read: false})
      .pipe(clean())
  );
}

function cleanPackageJsons() {
  let merge = mergeStream();
  findLambdas()
    .map( (lambda) => {
      merge.add(
        src([`${BUILD_DIR}/${lambda}/package.json`,
            `${BUILD_DIR}/${lambda}/package-lock.json`], 
            {allowEmpty: true})
          .pipe(clean())
      );
    })
  return merge;
}

function findLambdas() {
  return fs.readdirSync('./')
    .filter( (dir) => {
      return dir !== '.template'
          && fs.existsSync(join(dir, 'package.json'));
    });
}

function installMainNodeDev() {
  return src(`./package.json`)
    .pipe(install());
}

function installNodeDev() {
  let merge = mergeStream();
  findLambdas()
    .map( (lambda) => {
      merge.add(
        src(`./${lambda}/package.json`)
          .pipe(install())
      )
    });
  return merge;
}

function installNodeProduction() {
  let merge = mergeStream();
  findLambdas()
    .map( (lambda) => {
        merge.add(src(`./${lambda}/package.json`)
          .pipe(dest(`${BUILD_DIR}/${lambda}`))
          .pipe(install({npm: `--production --no-shrinkwrap --save false`})))
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
  return tsProject.src()
      .pipe(tsProject())
      .pipe(dest(`${BUILD_DIR}/${lambda}`))
}

function typescriptLambdas(done) {
  let merge = mergeStream();
  findLambdas()
    .map( (lambda) => {
      merge.add(typescriptFunction(lambda));
    })
  return merge;
}

function zipLambdas() {
  let merge = mergeStream();
  findLambdas()
    .map( (lambda) => {
      merge.add(
        src(`${BUILD_DIR}/${lambda}/*`)
          .pipe(zip(`${lambda}.zip`))
          .pipe(dest(`${ARTIFACTS}`))
      );
    })
  return merge;
}

exports.create = startLambdaFunction;
exports.install = parallel(
  installMainNodeDev, 
  installNodeDev
);
exports.package = series(
  cleanBuild, 
  typescriptLambdas, 
  installNodeProduction,
  zipLambdas
);
