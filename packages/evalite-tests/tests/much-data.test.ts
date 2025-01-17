import { readFileSync } from "fs";
import path from "path";
import { assert, expect, it } from "vitest";
import { runVitest } from "evalite/runner";
import { captureStdout, loadFixture } from "./test-utils.js";
import { getJsonDbEvals, getRows } from "@evalite/core";

it("Should report long datasets consistently in the same order", async () => {
  using fixture = loadFixture("much-data");

  const captured = captureStdout();

  await runVitest({
    cwd: fixture.dir,
    path: undefined,
    testOutputWritable: captured.writable,
    mode: "run-once-and-exit",
  });

  const jsonDbEvals = await getJsonDbEvals({
    dbLocation: fixture.jsonDbLocation,
  });

  expect(jsonDbEvals["Much Data"]![0]!.results).toMatchObject([
    {
      input: "first",
    },
    {
      input: "second",
    },
    {
      input: "third",
    },
    {
      input: "fourth",
    },
  ]);
});
