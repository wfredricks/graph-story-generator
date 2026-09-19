# Graph Story Generator — Requirements

## REQ-GSG-01: Graph Data Acquisition
The system SHALL accept a graph endpoint URL and one or more queries to pull source data. Queries specify node labels, property filters, and hop depth for edge traversal.

## REQ-GSG-02: Backstory Integration
The system SHALL accept zero or more backstory snippets — authored text fragments that provide texture beyond what the graph encodes. Snippets are woven into the generation context alongside graph data.

## REQ-GSG-03: Goal-Driven Generation
The system SHALL accept a set of goals that define what the generated output must achieve. Goals are evaluation criteria, not prompts.

## REQ-GSG-04: Context Assembly
The system SHALL walk graph edges from queried nodes to assemble structured context. Context includes node properties, relationship types, and connected-node summaries organized by label group.

## REQ-GSG-05: Draft Generation
The system SHALL generate a draft artifact from the assembled context, backstory snippets, and goals. The draft is grounded in graph data — every substantive claim traces to a node.

## REQ-GSG-06: Goal Evaluation
The system SHALL evaluate the generated draft against each goal, producing a pass/deficiency list. Each deficiency identifies what is missing or inadequate relative to the goal.

## REQ-GSG-07: Reflection and Revision
When evaluation produces deficiencies, the system SHALL reflect on the deficiency list and revise the draft. Revision targets specific deficiencies, not blind regeneration.

## REQ-GSG-08: Iteration Control
The system SHALL iterate the evaluate → reflect → revise cycle until all goals pass or a configurable maximum iteration count is reached. The final output includes the evaluation trail.

## REQ-GSG-09: Citation Tracking
The system SHALL track which graph nodes contributed to each section of the generated output. Citations are returned alongside the draft.

## REQ-GSG-10: Graph-Agnostic Operation
The system SHALL operate against any PolyGraph Viz endpoint without domain-specific configuration. The graph schema is discovered at query time.

## REQ-GSG-11: API-First
The system SHALL expose all capabilities through a REST API. No capability is UI-only.

## REQ-GSG-12: Draft Persistence
The system SHALL persist generated drafts with version history, including the input parameters, evaluation results, and revision trail for each version.

## REQ-GSG-13: Output Length Control
The system SHALL accept an expected output length (e.g., word count, page count, or qualitative size like "short scene" / "full chapter"). The generator uses this to calibrate output scope. The evaluator treats significant over/under-length as a deficiency.
