# Graph Story Generator — Use Cases

## UC-GSG-01: Generate a Chapter from Graph Context
**Actor:** Author  
**Trigger:** Author submits a generation request with graph queries, backstory, and goals.  
**Flow:**
1. System connects to the specified graph endpoint.
2. System executes queries and walks edges to assemble structured context.
3. System merges backstory snippets into the context.
4. System generates a draft grounded in the assembled context.
5. System evaluates the draft against each goal.
6. If deficiencies exist, system reflects and revises (up to max iterations).
7. System returns the final draft with citations and evaluation trail.

**Postcondition:** Draft persisted with version metadata, citations, and evaluation results.

## UC-GSG-02: Revise a Draft with Feedback
**Actor:** Author  
**Trigger:** Author submits revision feedback referencing an existing draft.  
**Flow:**
1. System loads the existing draft and its graph context.
2. System incorporates the author's feedback as additional goals/constraints.
3. System revises the draft targeting the feedback.
4. System re-evaluates against original goals plus new feedback.
5. System persists the revision as a new version.

**Postcondition:** New draft version linked to the previous, with revision trail.

## UC-GSG-03: Assemble Context Without Generating
**Actor:** Author  
**Trigger:** Author submits graph queries requesting context assembly only.  
**Flow:**
1. System connects to the graph endpoint and executes queries.
2. System walks edges and assembles structured context.
3. System returns the context as organized markdown — nodes grouped by label, with properties and relationships.

**Postcondition:** Author receives the assembled context for manual use (e.g., pasting into their own LLM session).

## UC-GSG-04: Evaluate an Externally Written Draft
**Actor:** Author  
**Trigger:** Author submits a draft they wrote themselves, along with goals and graph queries.  
**Flow:**
1. System assembles graph context from queries.
2. System evaluates the submitted draft against the goals using the graph context as ground truth.
3. System returns pass/deficiency list with specific citations to graph nodes.

**Postcondition:** Author receives structured evaluation of their own writing against graph-grounded goals.

## UC-GSG-05: Generate for Multiple Audiences
**Actor:** Author  
**Trigger:** Author submits a generation request specifying an audience label or properties.  
**Flow:**
1. System assembles context as in UC-GSG-01.
2. System weights emphasis based on the audience parameters (e.g., `audience.segment` node properties).
3. System generates a draft tailored to that audience.
4. Evaluation and iteration proceed as normal.

**Postcondition:** Audience-specific draft with the same graph grounding as other versions.

## UC-GSG-06: Browse Draft History
**Actor:** Author  
**Trigger:** Author requests draft history for a given generation.  
**Flow:**
1. System returns all versions of a draft, with input parameters, evaluation results, and revision notes for each.

**Postcondition:** Author can compare versions and understand the revision trail.
