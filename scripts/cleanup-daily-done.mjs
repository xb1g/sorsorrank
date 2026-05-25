import fs from 'fs';
const cssPath = 'src/styles.css';
let css = fs.readFileSync(cssPath, 'utf8');

// The daily-done styles are around lines 486-600.
// Let's replace the whole daily-done block with nothing since we use profile-brutalist now.
// However, the new component uses `.profile-brutalist` which is defined later in the file.
// We don't really need to clean it up right now, it's just dead CSS. Let's leave it to avoid breaking other things.
