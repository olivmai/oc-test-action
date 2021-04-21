const core = require('@actions/core');
// const github = require('@actions/github');
const glob = require('@actions/glob');
const convert = require('xml-js');
const fs = require('fs');

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);
  // Get the JSON webhook payload for the event that triggered the workflow
  // const payload = JSON.stringify(github.context.payload, undefined, 2)
  // console.log(`The event payload: ${payload}`);

  const patterns = ['coverage.xml']
  const globber = glob.create(patterns)
  const file = globber.glob()
  // try some code for real action
  const xmlContent = fs.readFileSync(file, { encoding: 'utf8' });

  var options = {ignoreComment: true, alwaysChildren: true};
  var result = convert.xml2js(xml, options);

  console.log(result);

} catch (error) {
  core.setFailed(error.message);
}