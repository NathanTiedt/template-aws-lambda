const { src, dest } = require('gulp');

function parseArgs() {
  let args = {};
  const argv = process.argv;
  for(let i=2; i < argv.length; i++) {
    if (argv[i].startsWith('--') 
        && !argv[i+1].startsWith('--')) {
      args[argv[i].replace(/\-/g, '')] = argv[i+1];
    }
  }
  return args;
}

function startNewLambda() {
  const args = parseArgs();
  return src('./.template/*')
    .pipe(dest(`./${args.name}/`));
}

exports.create = startNewLambda;
