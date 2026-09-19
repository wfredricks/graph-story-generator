# Graph Story Generator — Features

## F-GSG-01: Graph Context Assembly
Query a PolyGraph Viz endpoint with label filters and hop depth. Walk edges to build structured context organized by label group. Return context as markdown with node properties and relationship summaries.

## F-GSG-02: Backstory Injection
Accept authored text fragments that enrich generation context beyond graph data. Backstory snippets are tagged and woven into the prompt alongside graph-derived content.

## F-GSG-03: Goal-Driven Draft Generation
Generate output from assembled context + backstory + goals. The LLM prompt encodes goals as constraints, not suggestions. Output is grounded in graph nodes.

## F-GSG-04: Goal Evaluation
Evaluate a draft against each goal using the graph context as ground truth. Produce a structured pass/deficiency list. Each deficiency cites the goal, the gap, and relevant graph nodes.

## F-GSG-05: Reflective Revision Loop
When deficiencies exist, reflect on the specific gaps and revise the draft targeting them. Iterate up to a configurable max. Track the evaluation trail across iterations.

## F-GSG-06: Citation Tracking
Map each substantive claim in the output to the graph node(s) it derives from. Return citations as node ID references alongside the draft text.

## F-GSG-07: Output Length Control
Accept expected length as word count, page count, or qualitative size. Generator calibrates scope accordingly. Evaluator flags significant deviation as a deficiency.

## F-GSG-08: Audience Weighting
Accept audience parameters (label, segment properties) to weight emphasis in generation. Same graph, different lens.

## F-GSG-09: Context-Only Mode
Assemble and return graph context without generating — structured markdown ready for manual use or external LLM sessions.

## F-GSG-10: External Draft Evaluation
Accept an author-written draft and evaluate it against goals using graph context as ground truth. No generation — evaluation only.

## F-GSG-11: Draft Versioning
Persist every draft with its input parameters, evaluation results, and revision trail. Support version browsing and comparison.

## F-GSG-12: REST API
All features exposed through REST endpoints. No capability is UI-only.

## F-GSG-13: Graph-Agnostic Discovery
Discover graph schema at query time from the endpoint. No domain-specific configuration required.
