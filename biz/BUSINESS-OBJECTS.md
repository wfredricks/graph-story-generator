# Graph Story Generator — Business Objects

## GenerationRequest
The complete input to a generation run.
- **graphEndpoint** — URL of the PolyGraph Viz instance to query
- **queries** — list of QuerySpec (labels, filters, hop depth)
- **backstory** — list of authored text snippets
- **goals** — list of goal strings (evaluation criteria)
- **expectedLength** — target output size (word count, page count, or qualitative)
- **audience** — optional audience parameters (label, segment properties)
- **maxIterations** — max evaluate/revise cycles (default 3)

## QuerySpec
A single graph query within a request.
- **labels** — node labels to match
- **filter** — property-based filters on matched nodes
- **hops** — edge traversal depth from matched nodes (default 1)

## GraphContext
Assembled context from graph traversal.
- **nodes** — list of ContextNode (id, labels, properties, connected nodes)
- **edges** — list of ContextEdge (type, from, to)
- **summary** — organized markdown grouped by label prefix

## ContextNode
A single node's contribution to the context.
- **id** — graph node ID
- **labels** — node labels
- **properties** — node property map
- **connectedTo** — list of connected node summaries with relationship types

## Draft
A generated or submitted artifact.
- **id** — unique draft identifier
- **version** — version number within a generation run
- **content** — the generated text
- **citations** — list of Citation (text span → node ID)
- **wordCount** — actual output length
- **createdAt** — timestamp

## Citation
A link from draft content to a graph node.
- **nodeId** — the graph node this claim derives from
- **nodeLabel** — primary label of the cited node
- **textSpan** — the portion of draft text grounded by this node

## Goal
An evaluation criterion.
- **text** — the goal statement
- **status** — pass | deficient
- **deficiency** — if deficient, what is missing or inadequate
- **relevantNodes** — graph nodes relevant to this goal's evaluation

## EvaluationResult
The outcome of evaluating a draft against all goals.
- **goals** — list of Goal with status
- **passCount** — number of goals passed
- **deficiencyCount** — number of deficiencies
- **lengthStatus** — pass | over | under

## RevisionTrail
The history of an evaluate/revise cycle.
- **iterations** — list of Iteration (draft version, evaluation result, reflection notes)
- **finalVersion** — version number of the accepted draft
- **converged** — whether all goals passed or max iterations reached

## Iteration
One cycle of evaluate → reflect → revise.
- **version** — draft version number
- **evaluation** — EvaluationResult for this version
- **reflection** — the system's analysis of deficiencies (what to fix and how)

## GenerationResponse
The complete output of a generation run.
- **draft** — the final Draft
- **context** — the GraphContext used
- **trail** — RevisionTrail
- **request** — echo of the original GenerationRequest
