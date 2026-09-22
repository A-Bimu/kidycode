/*
 * The shared check harness.
 *
 * Two different functions on purpose: check() only records a result, step() runs a
 * body. check() refuses anything that is not a name, so a body can never be passed to
 * the recorder and silently ignored, and each sweep is wrapped so an unexpected throw
 * is recorded as a failure instead of ending the run before any results print.
 */

export const passed = [];
export const failed = [];

export function check(name) {
  if (typeof name !== "string") {
    throw new TypeError("check() only records. Use step() to run a body.");
  }
  passed.push(name);
  console.log(`  ok   ${name}`);
}

export async function step(name, body) {
  try {
    await body();
    check(name);
  } catch (error) {
    failed.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}: ${String(error.message).split("\n")[0]}`);
  }
}

export function stepSync(name, body) {
  try {
    body();
    check(name);
  } catch (error) {
    failed.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}: ${String(error.message).split("\n")[0]}`);
  }
}

export async function sweep(name, body) {
  try {
    await body();
  } catch (error) {
    failed.push(`${name} crashed: ${error.message}`);
    console.log(`  FAIL ${name} crashed: ${String(error.message).split("\n")[0]}`);
  }
}

export function report(label) {
  console.log(`\n${label}: ${passed.length} checks passed, ${failed.length} failed`);
  if (failed.length > 0) {
    for (const failure of failed) console.log(`  - ${failure.split("\n").slice(0, 4).join(" | ")}`);
    process.exitCode = 1;
  }
}