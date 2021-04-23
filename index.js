const core = require('@actions/core');
// const github = require('@actions/github');
const glob = require('@actions/glob');
const convert = require('xml-js');
const fs = require('fs');
const process = require('process');
const { exec } = require('child_process');

const COVERAGE_BRANCH = 'coverage';

const fail = (message) => {
  core.setFailed(message);
  console.error(message);
  process.exit(-1);
};

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

const clone = (cb) => {
  const repo = `https://${process.env.GITHUB_ACTOR}:${core.getInput('token')}@github.com/${process.env.GITHUB_REPOSITORY}.git`;
  const cloneInto = `repo-${new Date().getTime()}`;

  exec(`git clone ${repo} ${cloneInto}`, () => {
    exec(`git branch -a`, { cwd: cloneInto }, (be, bso, bse) => {
      const branches = bso.split('\n').filter(b => b.length > 2).map(b => b.replace('remotes/origin/', ''));

      if (branches.includes(COVERAGE_BRANCH)) {
        exec(`git checkout ${COVERAGE_BRANCH}`, { cwd: cloneInto }, cb);
      } else {
        exec(`git checkout --orphan ${COVERAGE_BRANCH}`, { cwd: cloneInto }, () => {
          exec(`rm -rf .`, { cwd: cloneInto }, cb);
        });
      }
    });
  });
};

const action = async () => {
  const globber = await glob.create('coverage.xml')
  const files = await globber.glob()

  if (files.length === 0) {
    fail('Coverage file not found :/');
  }

  // xml-js extension should ease the process to convert xml content to JSObject or json. See: https://www.npmjs.com/package/xml-js
  const options = { ignoreComment: true, alwaysChildren: true };
  const json = convert.xml2js(fs.readFileSync(files[0], { encoding: 'utf8' }), options);
  const metrics = retrieveGlobalMetricsElement(json);
  const total = parseInt(metrics.attributes.elements, 10);
  const covered = parseInt(metrics.attributes.coveredelements, 10);
  const coverage = parseFloat((100 * covered / total).toFixed(3));
  const summary = { total, covered, coverage };

  clone(() => {});

  console.log(summary);
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
