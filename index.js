const core = require('@actions/core');
// const github = require('@actions/github');
const glob = require('@actions/glob');
const convert = require('xml-js');
const fs = require('fs');
const process = require('process');

const action = async () => {
  const globber = await glob.create('coverage.xml')
  const files = await globber.glob()

  if (files.length === 0) {
    core.setFailed(error.message);
    console.error('Coverage file not found :/');
    process.exit(-1);
  }

  // xml-js extension should ease the process to convert xml content to JSObject or json. See: https://www.npmjs.com/package/xml-js
  var options = { ignoreComment: true, alwaysChildren: true };
  var json = convert.xml2js(fs.readFileSync(files[0], { encoding: 'utf8' }), options);

  // this result should be a JS object containing coverage infos
  console.log(json);
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
