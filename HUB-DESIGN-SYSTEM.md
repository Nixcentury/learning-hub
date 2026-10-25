# Shared Hub and engine controls

`public/shared/hub-ui.css` owns the palette, border contrast, corner radii and raised/pressed shadows. The Hub and subject menus use these same tokens as the central engines.

Owned player pages load, in order, their component styles, `../../shared/hub-ui.css?v=hub-1`, and `../../shared/hub-engine.css?v=hub-1`. Their root element has `class="hub-engine"`. Keep both shared stylesheets as explicit links: Quiz's existing restart action revalidates them along with its other owned assets.

`hub-engine.css` styles the Quiz, drag/numeric controls, notebook tools, backup dialog, review controls, activity tools and PDF toolbar. Persistent selections use a dark fill or inset edge; a held button uses a recessed shadow. Disabled controls have a dashed border and no raised shadow. Correct/incorrect, hint and pen-colour meanings remain distinct.

All engine presentation changes are inside `@media screen`. PDF documents, lesson content and printed paper layouts are outside this theme. The learning-sheet stylesheet imports the same shared files for its injected toolbar and answer buttons; it does not add the engine class to authored documents.

Validation for this change:

- Unit suite and complete Pages build.
- Quiz print/refresh browser checks: Thai/English worksheets and answer keys, latest assets/content, reasoning, ink, history and account context.
- Learning-sheet checks: accessible toggles, stable blanks, Thai/English and original print output.
- Review checks: Hub routing, topic/language selection, answers, print and legacy links.
- Real browser checks at 1280, 820, 390 and 302 pixels: MCQ, numeric, drag/tap, results/retry, notebook mode, backup and PDF page controls.

Subject navigation uses flat screen-only palettes from `hub-ui.css`: Physics yellow, Chemistry purple, Biology green, Science cyan, Mathematics coral red and Test blue. `showSection()` sets `data-hub-section` on the Hub view so the surrounding background follows tab clicks, shared routes and Back/Forward. Existing subject-body classes select the same palette in menu frames, including when a menu opens on its own. White reading panels, dark control borders and raised/pressed/focus states remain in place. Overview and Classroom keep their original colours. These menu palettes do not change player or PDF content, or printed layouts.

The Hub header's subject-menu toggle slides the tab bar in and out without navigating or rebuilding content frames. Its expanded state, bilingual label and inert menu stay synchronized, and the local preference survives reloads. Collapsing also moves the floating workspace area below the 74px header. The Test button is hidden from the main navigation; its existing route and sample tools remain available through development links.
