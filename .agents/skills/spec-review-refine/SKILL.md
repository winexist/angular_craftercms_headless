---
name: spec-review-refine
description: Review and refine a raw, already-drafted feature specification (e.g. a BA's field-by-field dump, a raw requirements doc, or a pasted description of screens/fields/business rules) into a clean, dev/QA-ready spec. Use whenever the user pastes or uploads a rough/raw feature spec, requirements doc, or module description and asks to "review," "refine," "clean up," "check," or "finalize" it — even if they don't use those exact words. Look for signals like field lists, dropdown/validation descriptions, screenshots references, or "here's my draft spec for X." Do NOT use this for turning a one-line idea or problem statement into a spec from scratch — that's the write-spec skill instead. This skill assumes a fairly detailed raw draft already exists and needs gap analysis + interview-based refinement.
---

# Spec Review & Refine

A skill for taking a raw, already-drafted feature specification and turning it into a clean, unambiguous, dev/QA-ready spec — via a structured gap analysis followed by a one-issue-at-a-time interview with the user.

This is NOT for writing a spec from a vague idea (use `write-spec` for that). This is for refining something that already has real detail — field lists, screen descriptions, business rules — but is unstructured, ambiguous, or has gaps.

## Core Workflow

1. **Intake** the raw spec
2. **Analyze** it for gaps across five categories (below)
3. **Interview** the user one issue at a time to resolve them
4. **Produce** the refined, restructured spec as a markdown file

Do not skip straight to step 4. The interview step is the point of this skill — it's what makes the output trustworthy instead of agent guessing at the user's intent.

---

## Step 1: Intake

Accept the raw spec from:
- Pasted text in the conversation
- An uploaded file (.docx, .pdf, .md, .txt) — use the `file-reading` skill to extract it first if not already in context
- A mix of both (e.g. text plus a referenced screenshot)

If a screenshot or mockup is referenced but not actually provided, note it as an open item rather than guessing at the UI.

Do a first read-through silently. Do not respond yet with the full analysis dump — go to Step 2.

## Step 2: Analyze for Gaps

Scan the raw spec across these five categories. Be thorough — this is the most valuable part of the skill. For each issue found, write it as a **specific, answerable question**, not just a vague flag.

### A. Structural completeness
Does the spec have (or imply) these elements? Flag what's missing:
- Overview / purpose of the feature
- Actors / roles involved (who does what)
- Entry point / navigation path (how users get to this feature)
- End-to-end process flow (not just the form — what happens after submission)
- Out-of-scope / non-goals (if the raw draft doesn't say what's excluded)

### B. Field-level validation gaps
For every field, form, or input mentioned, check whether the raw spec states:
- Required vs optional (don't assume — flag if ambiguous)
- Data type / format (date format, text length limits, numeric ranges)
- For file uploads: accepted file types, size limit, single vs multiple files (the example below states 2mb/1 file but not file *type* — that's a gap)
- Dependent/conditional fields (e.g. a field that only appears for certain dropdown selections) — are all the conditional paths spelled out?

### C. Edge cases & error states
The raw draft almost always describes the happy path only. Flag missing handling for:
- Duplicate or repeat requests
- Failed/rejected uploads (wrong file type, oversized file)
- Validation failures (what message, what happens next)
- Cancellation / withdrawal of a request mid-process
- What happens if required upstream data doesn't exist (e.g. no service record on file)
- Concurrent or in-progress requests (can a user submit a second request while the first is pending?)
- Rejection/decline by the approver — is there a stated flow back to the employee?

### D. Business rule consistency
Check numbers, conditions, and policies against each other for conflicts or unstated logic:
- Pricing/fee rules — are the trigger conditions precise? (e.g. "first request free" — first ever, first per document type, first per calendar year?)
- Approval/workflow logic — who approves what, and what happens on rejection?
- Any rule stated once but not carried through to a related section

### E. Non-functional & cross-cutting concerns
Raw specs almost never mention these — flag them as open questions rather than assuming:
- Roles & permissions (who can view/approve/release — is HR a single role or split?)
- Audit trail specifics (what gets logged, for how long)
- Notifications (email/SMS/in-app — on submission, approval, rejection, release?)
- SLAs / turnaround time expectations
- Data retention / privacy considerations for uploaded documents

Compile the findings into a single **numbered issues list**, grouped by category (A–E), each phrased as a direct question. Do not show raw category labels to the user if they're non-technical — use the plain intent above ("Field gaps," "Edge cases," etc.) sensed from context, per the communication guidance below.

## Step 3: Interview — One Issue at a Time

This is the key mechanic. Do **not** dump the full issues list on the user at once and ask them to answer everything in one message.

Instead:
1. Give a brief one-paragraph summary: how many issues found, grouped by category, so the user knows the scope up front.
2. Then go through the list **one issue at a time**: state the issue, ask the specific question, wait for the user's answer before moving to the next.
3. Record each resolution as you go (mentally / in scratch notes) — don't ask the user to repeat themselves later.
4. If the user doesn't know or wants to punt on an item, accept "leave as open question" or "not applicable" as a valid answer — do not force resolution. It will be carried into the final spec's **Open Questions** section instead.
5. If the user's answer surfaces a new gap or inconsistency, add it to the list on the fly and keep going — don't restart.
6. When the list is exhausted, confirm with the user that they're ready for the refined spec before generating it.

Keep this conversational and efficient — one question per turn, not a wall of sub-questions. If an issue has 2-3 closely related sub-parts (e.g. "for file uploads: what file types, and is there a size limit override for exceptions?"), it's fine to bundle those into one turn since they're one decision.

## Step 4: Produce the Refined Spec

Once the interview is done, generate the refined spec as a markdown file (use the `md` conventions — this is a standalone document, so create an actual file rather than a long inline chat response).

### Refined Spec Structure

```markdown
# [Feature Name] — Specification

## 1. Overview
Purpose and business context, 2-4 sentences.

## 2. Actors & Roles
Who interacts with this feature and what they can do.

## 3. Entry Point
Where/how the user accesses this feature.

## 4. Process Flow
End-to-end flow as numbered steps or a simple sequence — not just the form, but what happens after submission through to completion.

## 5. Screens & Fields
For each screen/form, a table or list of fields with:
- Field name
- Type (dropdown, text, date picker, file upload, etc.)
- Required/Optional
- Validation rules (format, limits, file constraints)
- Conditional logic (if the field depends on another selection)

## 6. Business Rules
Numbered, unambiguous rules (pricing, eligibility, approval logic), each stated precisely enough that two engineers would implement it identically.

## 7. Notifications & Messaging
System messages, confirmations, and notification triggers — exact copy where the user provided it, otherwise flagged as TBD.

## 8. Edge Cases & Error Handling
Each edge case with expected system behavior.

## 9. Audit & Compliance
Logging, retention, and traceability requirements.

## 10. Out of Scope
Explicitly excluded from this version.

## 11. Open Questions
Anything the user deferred during the interview, tagged with who should resolve it if known.
```

Adjust section names/order to fit the actual feature — this is a template, not a rigid mold. Omit sections that genuinely don't apply (e.g. no file uploads → drop that sub-section, don't leave it empty).

### Output
- Save as a `.md` file in the outputs directory (see md/docx file-creation guidance)
- If the user later asks for a Word version, convert using the `docx` skill
- Briefly summarize what changed from the raw draft (structure added, ambiguities resolved) in 2-3 sentences after sharing the file — don't re-paste the whole document in chat

---

## Communication Style

Match the user's vocabulary — if they use business/BA terms (e.g. "201 file," "COE," "service record"), mirror those rather than translating into generic PM jargon. Don't over-explain basic terms like "required field" or "dropdown" unless the user seems unfamiliar with them.

## Tips

- Favor precision over politeness-padding: a good issue is "Is 'first request' scoped per document type or per employee overall?" not "Could you clarify the pricing logic a bit?"
- If the raw spec already answers something correctly and completely, don't manufacture a question about it just to seem thorough.
- Large specs (10+ fields, multiple document types) will generate a long issues list — that's fine, just keep the one-at-a-time pacing so it doesn't overwhelm the user.
- If mid-interview the user says "just use your best judgment on the rest," stop the one-by-one interview, make reasonable assumptions for remaining items, mark those assumptions clearly in the final Open Questions or inline as "(assumed: ...)", and proceed to Step 4.