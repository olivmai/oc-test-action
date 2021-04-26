const core = require('@actions/core');
// const github = require('@actions/github');
const glob = require('@actions/glob');
const convert = require('xml-js');
const fs = require('fs');
const process = require('process');
const { exec } = require('child_process');

const COVERAGE_BRANCH = 'coverage';
const COVERAGE_FILE = core.getInput('coverage-file');
const SUMMARY_FILE = 'coverage-summary.json';
const REPO = `https://${process.env.GITHUB_ACTOR}:${core.getInput('token')}@github.com/${process.env.GITHUB_REPOSITORY}.git`;

const fail = (message) => {
  core.setFailed(message);
  console.error(message);
  process.exit(-1);
};

const execute = (command, options) => new Promise(function(resolve, reject) {
  const cb = (error, stdout) => {
    if (error) {
      core.setFailed(error);
      reject(error);

      return;
    }

    resolve(stdout.trim());
  };

  if (!!options) {
    exec(command, options, cb);
  } else {
    exec(command, cb);
  }
});

const findNode = (tree, name) => {
  if (!tree.elements) {
    fail('Wrong coverage file format');
  }

  const element = tree.elements.find(e => e.name === name);

  if (!element) {
    fail('Wrong coverage file format');
  }

  return element;
}

const retrieveGlobalMetricsElement = json => findNode(findNode(findNode(json, 'coverage'), 'project'), 'metrics');

const clone = async () => {
  const cloneInto = `repo-${new Date().getTime()}`;

  await execute(`git clone ${REPO} ${cloneInto}`);
  const list = await execute(`git branch -a`, { cwd: cloneInto });
  const branches = list.split('\n').filter(b => b.length > 2).map(b => b.replace('remotes/origin/', ''));

  if (branches.includes(COVERAGE_BRANCH)) {
    await execute(`git checkout ${COVERAGE_BRANCH}`, { cwd: cloneInto });
  } else {
    await execute(`git checkout --orphan ${COVERAGE_BRANCH}`, { cwd: cloneInto });
    await execute(`rm -rf *`, { cwd: cloneInto });
  }

  return cloneInto;
};

const push = async (cwd) => {
  await execute('git config --local user.email zozor@openclassrooms.com', { cwd });
  await execute('git config --local user.name Zozor', { cwd });
  await execute('git add .', { cwd });
  await execute('git commit -m "Update coverage info"', { cwd });
  await execute(`git push ${REPO} HEAD`, { cwd });
};

const parseCoverage = async () => {
  const globber = await glob.create(COVERAGE_FILE);
  const files = await globber.glob();

  if (files.length === 0) {
    fail('Coverage file not found :/');
  }

  const options = { ignoreComment: true, alwaysChildren: true };
  const json = convert.xml2js(fs.readFileSync(files[0], { encoding: 'utf8' }), options);
  const metrics = retrieveGlobalMetricsElement(json);
  const total = parseInt(metrics.attributes.elements, 10);
  const covered = parseInt(metrics.attributes.coveredelements, 10);
  const coverage = parseFloat((100 * covered / total).toFixed(3));

  return { total, covered, coverage };
}

const action = async () => {
  const coverage = await parseCoverage();
  const workingDir = await clone();
  await fs.writeFile(JSON.stringify(coverage), `${workingDir}/${SUMMARY_FILE}`);
  await push(workingDir);

  console.log(coverage);
};

try {
  // this is the default action code from the tutorial
  // I keep it for now, as we are sure it works and runs in the CI
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);

  ///////////////////////////////////////////
  // BELOW IS THE CODE FOR OUR REAL ACTION //
  ///////////////////////////////////////////

  action();
} catch (error) {
  core.setFailed(error.message);
}
