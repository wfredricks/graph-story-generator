# Graph Story Generator — Integration Story

## Scenario: Bill generates Chapter 5 of the Fountains book

Bill opens the graph-story-generator UI. The Fountains SIG is running on localhost:4445.

**1. Configure the request.**
Bill enters the graph endpoint (`http://localhost:4445`). He adds three queries:
- `book.chapter` where chapter number = 5
- `science.mechanism` at 1 hop from matched chapters
- `geology.rock_layer` at 1 hop from matched mechanisms

The **context assembler** hits the PolyGraph Viz API, walks the edges, and returns a structured context: Chapter 5 connects to the hydroplate mechanism and catastrophic plate tectonics, which connect to the Sauk and Tippecanoe megasequences, which connect to specific rock layers.

**2. Add backstory.**
Bill pastes two snippets:
- "Noah's hands — thick, split at the knuckles from years of pitch work."
- "The first drops fell at midday. Emzara was grinding grain."

These aren't in the graph. They're authorial texture.

**3. Set goals.**
- "The geological mechanism must be dramatized through character experience, not explained didactically."
- "A skeptical geologist should find the sequence of events plausible."
- "The scene should feel lived-in — sensory details, not narration from a distance."

**4. Set length.**
Bill selects "full chapter" (~3,000 words).

**5. Generate.**
The system sends the assembled context + backstory + goals + length to the LLM. First draft comes back: 2,800 words. Noah watches the ground crack. The hydroplate mechanism is described through what he sees and feels, not through exposition.

**6. Evaluate.**
The evaluator checks each goal:
- ✅ Geological mechanism dramatized — Noah feels the ground split, water erupts.
- ⚠️ Skeptical plausibility — the mechanism is dramatic but doesn't reference specific rock layer evidence. Deficiency: "The Sauk megasequence deposition is implied but not grounded in observable geology."
- ✅ Lived-in feel — sensory details present throughout.
- ✅ Length — 2,800 words within range of 3,000 target.

**7. Reflect and revise.**
The system reflects: "The Sauk megasequence connection needs to surface through something Noah or Emzara observes — sediment patterns, water color, the sequence of what deposits where." It revises, adding a passage where Emzara notices the layered mud patterns as the water recedes — unknowingly describing what geologists would later call the Sauk sequence.

**8. Re-evaluate.**
- ✅ All goals pass.
- Final draft: 3,100 words, 14 graph-node citations, 2 iterations.

**9. Output.**
Bill receives the chapter with inline citations (`[geology.megasequence:sauk]`, `[science.mechanism:hydroplate]`). He can click any citation to see the source node in the graph. The revision trail shows what changed between v1 and v2 and why.

---

## What this story reveals for /dom

- **GenerationRequest** assembles cleanly — queries, backstory, goals, length are independent inputs.
- **GraphContext** is the bridge between the graph API and the generator — it must carry enough structure for the evaluator to check claims against nodes.
- **EvaluationResult** needs per-goal granularity with node references — the evaluator must say WHICH nodes are under-represented, not just "needs more geology."
- **The revision loop is targeted** — reflection identifies specific gaps, revision addresses them. The Draft versions are diffable.
- **Citations are inline** — they're part of the draft text, not a separate appendix. The UI can make them interactive.
