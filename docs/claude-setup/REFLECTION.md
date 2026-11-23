# Reflection: Claude Code workflow on SubTrack

Related records: [annotated session log](SESSION_LOG.md) ·
[US-3 workflow docs](../workflow/US-3/) · `git log --oneline --decorate us3-explore~1..`

## 1. How does the Explore→Plan→Implement→Commit workflow compare to your previous approach?
Before using Claude Code, my approach was to write code in VS Code with GitHub Copilot. Copilot was helpful for autocompleting lines and small functions as I typed, and I used Copilot Chat to ask questions or generate snippets. However, it mostly worked at the level of the file I had open, so its suggestions didn't always account for my overall project structure, my existing data models, or how different files depended on each other. I was still the one deciding what to build, breaking the work into steps, and connecting everything together. Planning mostly happened in my head, and I usually jumped straight into writing code, accepting or rejecting suggestions line by line.

The Explore→Plan→Implement→Commit workflow changed this significantly while building my subscription manager. In the Explore step, Claude Code read the codebase first, so it understood how my subscription data, such as payments, fees, and expiration dates, was structured before suggesting anything. In the Plan step, it laid out what it intended to do before touching any code, which let me catch problems early, like deciding how renewal and expiration logic should work before it was built. Reviewing a plan turned out to be much faster than reviewing finished code. During Implement, it made coordinated changes across multiple files that stayed consistent with the existing code, rather than me writing each piece with line-by-line suggestions. Finally, committing after each step gave me clear checkpoints, so if something broke I could see exactly what had changed and roll it back.

There were trade-offs. The structured workflow felt slower at the beginning, since exploring and planning take time before any code appears. However, it saved time overall because there was far less rework. I also learned that I had to stay engaged during the Plan step, because approving a plan without reading it carefully meant mistakes carried straight into implementation. For quick edits and small fixes, Copilot's inline suggestions in VS Code are still faster and feel more natural.

Overall, the biggest difference was moving from AI that assists me as I type to AI that works across my whole project with a shared plan. Copilot made me faster at writing code, while this workflow made me think more deliberately about design before coding and gave me a cleaner, more reversible history of my work.




## 2. What context management strategies worked best?
The strategy that helped the most was setting up CLAUDE.md as a central entry point for project context. Instead of pasting the same background information into every session, I used @-imports to pull in my PRD, ARCHITECTURE, and API documents, so Claude Code started each session already knowing what the subscription manager was supposed to do, how it was structured, and how the endpoints were defined. I also ran /init several times as a consistency check, comparing what Claude Code generated from the actual codebase against what my CLAUDE.md claimed. This helped me catch places where my documentation had drifted from the code, and keeping those in sync meant Claude Code was working from accurate information rather than outdated assumptions (log entries 1–4).

Using plan mode to settle open questions before any code was written also worked well. Rather than letting ambiguities surface halfway through implementation, I answered them up front, so the decisions became part of the plan and stayed in context for the rest of the task. This was much more effective than correcting misunderstandings after the fact, because each correction mid-implementation adds noise to the conversation and makes it harder for the model to keep track of what was actually decided (log entry 7).

For work that spanned multiple steps or sessions, I relied on docs/PROGRESS.md and the plan file as a running checklist. Because these lived in the repo rather than in the chat history, they survived context resets and new sessions. Claude Code could read them to see what was done, what was in progress, and what came next, which kept long tasks on track without me having to re-explain where we had left off (log entry 11).

Finally, while iterating on code, I had Claude Code run the narrowest relevant test first instead of the whole test suite. This kept the output short and focused on the specific behavior being changed, which meant less irrelevant test output filling up the context window and faster feedback on each change. The full suite was saved for when a piece of work was complete (log entry 9).

One gap I noticed is that my CLAUDE.md imports docs/claude-setup/CONTEXT_STRATEGY.md, but that file doesn't exist yet. This is a small but useful lesson: a broken import means context I intended to provide is silently missing, so I plan to either create that file or remove the reference.


