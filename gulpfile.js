const { src, dest, series, parallel, task } = require('gulp');
const { join, resolve } = require('path');
const clean = require('gulp-clean');
const fs = require('fs');
const install = require('gulp-install');
const mergeStream = require('merge-stream');
const program = require('commander');
const replace = require('gulp-replace');
const run = require('gulp-run');
const ts = require('gulp-typescript');
const zip = require('gulp-zip');

const ARTIFACTS = `./artifacts`;
const BUILD_DIR = `./build`;
const NO_NAME = 'NONE';

/**
 *  @return {stream} - gulp stream
 *  @desc cleans the build directory and the artifacts directory
 */
function cleanBuild() {
  return mergeStream(
    src(`${BUILD_DIR}/*`, {read: false})
      .pipe(clean()),
    src(`${ARTIFACTS}/*`, {read: false})
      .pipe(clean())
  );
}

/**
 *  @return {stream} - gulp stream
 *  @desc removes the package files from the build directory
 *        keeps zips as tiny as possible
 */
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

/**
 *  @return {string[]} - array of directory names of lambdas
 *  @desc loops through the directories to find any that contain a package.json
 */
function findLambdas() {
  return fs.readdirSync('./')
    .filter( (dir) => {
      return dir !== '.template'
          && fs.existsSync(join(dir, 'package.json'));
    });
}

/**
 *  @return {stream} - gulp stream
 *  @desc installs the main set of node modules in the root package.json
 */
async function installMainNodeDev() {
  return src(`./package.json`)
    .pipe(install());
}

/**
 *  @return {stream} - gulp stream
 *  @desc installs the node modules for each lambda
 */
async function installNodeDev() {
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

/**
 *  @return {stream} - gulp stream
 *  @desc installs the production node module for each lambda
 */
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

/**
 *  @return {stream} - gulp stream
 *  @desc creates a lambda from the template directory
 */
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

/* Doesn't return a reduced set of files, only all the shared files
function typescriptFunction(lambda) {
  const tsProject = ts.createProject(`./${lambda}/tsconfig.json`);
  return src([`./${lambda}/**\/*.ts`, `./shared/**\/*.ts`], {base: `./${lambda}/`})
      .pipe(tsProject())
      .pipe(dest(`${BUILD_DIR}/${lambda}`))
}
*/

/**
 *  @return {stream} - gulp stream
 *  @desc uses the tsconfig in the lambda directory to transpile the code
 */
function typescriptFunction(lambda) {
  return run(`cd ./${lambda}/ && tsc`).exec();
}

/**
 *  @return {stream} - gulp stream
 *  @desc transpiles each lambda into build directory
 *
 */
function typescriptLambdas(done) {
  let merge = mergeStream();
  findLambdas()
    .map( (lambda) => {
      merge.add(typescriptFunction(lambda));
    })
  return merge;
}

/**
 *  @return {stream} - gulp stream
 *  @desc zips all of the lambdas in the build directory
 *        puts them into the artifact directory
 */
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

/**
 *  @example 
 *    // empties ./build and ./artifacts
 *    gulp clean
 *  @desc cleans the build and artifacts directory
 */
exports.clean = cleanBuild;

/**
 *  @example
 *    // create a lambda directory named new
 *    gulp create --name new
 *  @desc copies the template directory for a new lambda
 */
exports.create = startLambdaFunction;

/**
 *  @example
 *    gulp install
 *  @desc installs root node modules and each lambda's modules
 */
exports.install = parallel(
  installMainNodeDev, 
  installNodeDev
);

/**
 *  @example
 *    gulp package
 *  @desc for each lambda, transpiles, installs modules, zips
 */
exports.package = series(
  cleanBuild, 
  typescriptLambdas, 
  installNodeProduction,
  zipLambdas
);
