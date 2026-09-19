# Graph Story Generator — Story

## The Zeroth Story: Fountains of the Great Deep

Bill spent months building a screenplay and book about Noah's Flood, grounded in real geological science. The source material lived in a PolyGraph SIG — 278 nodes encoding book chapters, characters, locations, scientific claims, geological mechanisms, experimental evidence, and audience segments, all connected by typed edges that captured *why* things related.

The writing process was manual: Bill held the graph in his head, pulled relevant nodes mentally, wrote scenes, then cross-checked against the science. When a chapter needed the Sauk megasequence, he had to remember which mechanisms connected to it, which evidence supported those mechanisms, and which characters were present in that part of the narrative. The graph existed but the writer couldn't query it mid-sentence.

What he wished the tool did:

1. **Pull the right context automatically.** "I'm writing Chapter 5" should assemble the characters, locations, mechanisms, and geology connected to that chapter — from the graph, not from memory.

2. **Accept backstory.** The graph has the skeleton, but scenes need texture — a snippet about Noah's calloused hands, Emzara's quiet faith, the smell of pitch. These aren't graph nodes. They're authored fragments that give the generated prose body.

3. **Have goals.** "This chapter should make a skeptical geologist pause." "This scene should feel cinematic, not academic." Goals aren't prompts — they're evaluation criteria. The output either meets them or it doesn't.

4. **Evaluate and iterate.** First draft misses a goal? The system should identify the deficiency ("the geological mechanism was stated but not dramatized"), reflect on it, and revise — not just regenerate blindly.

5. **Work from any graph.** The Fountains SIG is the first case, but the same tool should accept a STORES SIG endpoint and produce a technical narrative, or a proposal SIG and produce a capabilities brief.

## The Interaction

```
POST /generate
{
  "graphEndpoint": "http://localhost:4445",
  "queries": [
    { "labels": ["book.chapter"], "filter": { "number": 5 } },
    { "labels": ["science.mechanism"], "hops": 1 },
    { "labels": ["geology.rock_layer"], "hops": 1 }
  ],
  "backstory": [
    "Noah's hands — thick, split at the knuckles from years of pitch work.",
    "The first drops fell at midday. Emzara was grinding grain."
  ],
  "goals": [
    "The geological mechanism must be dramatized, not explained.",
    "A skeptical reader should find the science plausible.",
    "The scene should feel lived-in, not narrated from a distance."
  ]
}
```

The system:
1. Queries the graph endpoint, walks edges, assembles structured context.
2. Weaves backstory snippets into the context.
3. Generates a draft.
4. Evaluates the draft against each goal → produces a pass/deficiency list.
5. If deficiencies exist, reflects and revises. Repeats until goals are met or max iterations reached.
6. Returns the final draft with citations to graph nodes and the evaluation trail.
