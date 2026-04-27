import runPlaybackTests from "../src/playback.test.js";
import runTimerUtilsTests from "../src/timerUtils.test.js";

const testSuites = [
  ["playback helpers", runPlaybackTests],
  ["timer utils", runTimerUtilsTests],
];

let failures = 0;

for (const [label, runSuite] of testSuites) {
  try {
    runSuite();
    console.log(`PASS ${label}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${label}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`PASS ${testSuites.length} test suites`);
}
