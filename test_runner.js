import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function runTestNTimes(scriptName, count) {
  console.log(`\n====================================================`);
  console.log(`RUNNING SCRIPT: ${scriptName} ${count} TIMES`);
  console.log(`====================================================`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 1; i <= count; i++) {
    console.log(`\n--- [RUN ${i}/${count}] Starting ${scriptName}... ---`);
    const startTime = Date.now();
    try {
      const { stdout, stderr } = await execPromise(`node ${scriptName}`);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✓ Run ${i} passed in ${duration}s.`);
      successCount++;
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`✗ Run ${i} failed in ${duration}s.`);
      console.error(`Error details:\n`);
      if (error.stdout) console.error(`Stdout:\n`, error.stdout);
      if (error.stderr) console.error(`Stderr:\n`, error.stderr);
      if (error.message) console.error(`Message:\n`, error.message);
      failCount++;
    }
  }

  console.log(`\n--- SUMMARY FOR ${scriptName} ---`);
  console.log(`Total Runs: ${count}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failures: ${failCount}`);
  
  return failCount === 0;
}

async function start() {
  const count = 3;
  console.log(`Starting 3x loop verification for test suite...`);
  
  const workflowSuccess = await runTestNTimes('test_workflow.js', count);
  const distSuccess = await runTestNTimes('test_dist.js', count);

  if (workflowSuccess && distSuccess) {
    console.log(`\n🎉 ALL TESTS COMPLETED 3 TIMES SUCCESSFULLY WITH ZERO FAILURES!`);
    process.exit(0);
  } else {
    console.error(`\n✗ SOME VERIFICATIONS FAILED. PLEASE EXAMINE LOGS FOR BUGS.`);
    process.exit(1);
  }
}

start().catch(console.error);
