/**
 * Unit tests for RDE summary parsing (#132).
 */

import assert from "node:assert/strict";

import {
  buildValidationErrorSummary,
  parseValidatedRdeSummary,
} from "./rde-summary.js";

const SAMPLE = JSON.stringify({
  rde_review_output: {
    spec_version: "0.1",
    subject_ref: "https://example.test/subj",
    categories: {
      preserved: [{ id: "p1" }],
      transformed: [],
      lost: [],
      complemented: [],
      deviation_risk: [],
      intentionally_unresolved: [],
      next_update_policy: [],
    },
  },
});

const summary = parseValidatedRdeSummary(SAMPLE);
assert.ok(summary);
assert.equal(summary!.state, "validated");
assert.equal(summary!.total_items, 1);
assert.equal(summary!.category_counts.preserved, 1);

const err = buildValidationErrorSummary({
  stdout: "",
  stderr: "RDE validation failed (3 issue(s)).",
  exitCode: 2,
});
assert.equal(err.state, "validation_error");
assert.equal(err.issue_count, 3);

console.log("ok: rde-summary unit tests");
