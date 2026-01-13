import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { globSync } from 'glob';
import { PathOrFileDescriptor } from 'fs';

const ROOT = 'docs'; // adjust if needed

function processFile(path: PathOrFileDescriptor) {
  const original = readFileSync(path, 'utf8');
  let text = original;

  // First pass: keep original overload structure
  text = collapseOverloadedMethods(text);

  const lines = text.split('\n');
  const out: string[] = [];

  let i = 0;

  while (i < lines.length) {
    let line = lines[i];

    // ---------- Handle a single Call Signature block as a unit ----------
    if (/^####\s+Call Signature/i.test(line)) {
      const section: string[] = [];
      // capture this call signature block until next call signature or next method heading
      while (i < lines.length) {
        const cur = lines[i];
        if (section.length > 0 && /^####\s+Call Signature/i.test(cur.trim())) {
          break;
        }
        if (section.length > 0 && /^###\s+/.test(cur)) {
          break;
        }
        section.push(cur);
        i++;
      }
      out.push(...processCallSignatureSection(section));
      continue;
    }

    // ---------- Normalize 5# headings to 4# for consistency ----------
    if (
      /^#####\s+(Parameters|Returns|Throws|Example|Examples|Remarks)\b/.test(
        line
      )
    ) {
      // rewrite in-place and re-process this line
      lines[i] = line = line.replace(/^#####/, '####');
    }

    // ---------- Convert parameter tables to have #### Parameters heading and capture full table ----------
    if (line.trim().match(/^\|\s*Parameter\s*\|\s*Type/i)) {
      // Check if previous non-empty line is already "#### Parameters"
      let lookBack = out.length - 1;
      while (lookBack >= 0 && out[lookBack].trim() === '') lookBack--;

      if (lookBack < 0 || !out[lookBack].startsWith('#### Parameters')) {
        // Remove trailing blanks then add heading
        while (out.length > 0 && out[out.length - 1].trim() === '') out.pop();
        out.push('');
        out.push('#### Parameters');
        out.push('');
      }

      // Emit the whole table block: header + following rows
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        out.push(lines[i]);
        i++;
      }
      out.push('');
      continue;
    }

    // ---------- THROWS: normalize into a single table and merge consecutive headings (non-overload context) ----------
    if (line.startsWith('#### Throws')) {
      type Row = { type: string; desc: string };
      const rows: Row[] = [];

      const pushLineAsRow = (raw: string) => {
        const cleaned = raw.trim().replace(/^-\s*/, '');
        const m = cleaned.match(/^`?([^`\s|]+)`?\s*(.*)$/);
        if (m) {
          rows.push({ type: m[1].trim(), desc: (m[2] || '').trim() });
        } else if (cleaned) {
          rows.push({ type: '-', desc: cleaned });
        }
      };

      // consume one or more consecutive "#### Throws" sections
      while (i < lines.length && lines[i].startsWith('#### Throws')) {
        i++; // skip heading

        // skip blank lines
        while (i < lines.length && lines[i].trim() === '') i++;

        if (i >= lines.length) break;

        // if table-form throws, parse all rows
        if (lines[i].trim().startsWith('|')) {
          const table: string[] = [];
          while (i < lines.length && lines[i].trim().startsWith('|')) {
            const l = lines[i].trim();
            table.push(l);
            i++;
          }
          for (const r of table) {
            const cells = r.split('|').map((c) => c.trim());
            if (
              cells.length >= 4 &&
              cells[1] &&
              cells[2] &&
              !/^(-{2,}|Type)$/i.test(cells[1]) &&
              !/^(-{2,}|Description)$/i.test(cells[2])
            ) {
              const typeCell = cells[1].replace(/`/g, '').trim();
              const descCell = cells[2].trim();
              rows.push({ type: typeCell || '-', desc: descCell || '-' });
            }
          }
        } else {
          // freeform lines until next heading or blank line
          while (
            i < lines.length &&
            lines[i].trim() !== '' &&
            !/^### /.test(lines[i]) &&
            !/^#### /.test(lines[i]) &&
            !/^##### /.test(lines[i])
          ) {
            pushLineAsRow(lines[i]);
            i++;
          }
        }

        // skip blank lines between throws blocks
        while (i < lines.length && lines[i].trim() === '') i++;
      }

      // emit one normalized table
      out.push('#### Throws', '');
      out.push('| Type | Description |');
      out.push('|------|-------------|');
      for (const r of rows) {
        out.push(`| \`${r.type || '-'}\` | ${r.desc || '-'} |`);
      }
      out.push('');
      continue;
    }

    // ---------- RETURNS: normalize into a table (after heading normalization) ----------
    if (line.startsWith('#### Returns')) {
      i++; // skip heading

      // skip blank lines
      while (i < lines.length && lines[i].trim() === '') i++;

      if (i >= lines.length) {
        out.push('#### Returns');
        break;
      }

      // type line (e.g. `Promise`\<`void`\> or `Promise<void>`)
      const typeLine = lines[i].trim();
      i++;

      // skip blank lines
      while (i < lines.length && lines[i].trim() === '') i++;

      // description lines until blank or next heading
      const descParts: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !/^###? /.test(lines[i]) &&
        !/^#### /.test(lines[i]) &&
        !/^##### /.test(lines[i])
      ) {
        descParts.push(lines[i].trim());
        i++;
      }

      // clean type: remove backticks and backslash escapes
      let rawType = typeLine
        .replace(/`/g, '')
        .replace(/\\</g, '<')
        .replace(/\\>/g, '>');
      rawType = rawType.trim();

      // strip Promise<...> wrapper
      const type = rawType.replace(/^Promise\s*<\s*([^>]+)\s*>$/i, '$1').trim();

      const desc = descParts.join(' ');

      out.push('#### Returns', '');
      out.push('| Type | Description |');
      out.push('|------|-------------|');
      out.push(`| \`${type}\` | ${desc || '-'} |`);
      out.push('');

      // skip any trailing blank lines we already consumed
      while (i < lines.length && lines[i].trim() === '') i++;

      continue;
    }

    // ---------- Handle orphan Param sections (from overloads) ----------
    if (line.startsWith('#### Param')) {
      // Skip orphan param lines that appear before method signatures
      i++;
      while (i < lines.length && lines[i].trim() === '') i++;
      continue;
    }

    // default: copy line
    out.push(line);
    i++;
  }

  // second pass: transform Examples into admonitions
  text = out.join('\n');
  text = transformExamples(text);

  writeFileSync(path, text);
}

// ---------- Process a single Call Signature block ----------
function processCallSignatureSection(section: string[]): string[] {
  const t = (s: string) => s.trim();
  // normalize 5# to 4# inside the section
  section = section.map((l) =>
    l.replace(
      /^#####\s+(Parameters|Returns|Throws|Example|Examples|Remarks)\b/,
      '#### $1'
    )
  );

  const out: string[] = [];
  const throwRows: { type: string; desc: string }[] = [];
  let firstThrowsOutIdx: number | null = null;

  const pushLineAsThrowRow = (raw: string) => {
    const cleaned = raw.trim().replace(/^-\s*/, '');
    const m = cleaned.match(/^`?([^`\s|]+)`?\s*(.*)$/);
    if (m) {
      throwRows.push({ type: m[1].trim(), desc: (m[2] || '').trim() });
    } else if (cleaned) {
      throwRows.push({ type: '-', desc: cleaned });
    }
  };

  let i = 0;
  while (i < section.length) {
    const line = section[i];

    // Parameter table without heading: add heading, then copy table
    if (t(line).match(/^\|\s*Parameter\s*\|\s*Type/i)) {
      // ensure "#### Parameters" before
      let lookBack = out.length - 1;
      while (lookBack >= 0 && out[lookBack].trim() === '') lookBack--;
      if (lookBack < 0 || !out[lookBack].startsWith('#### Parameters')) {
        while (out.length > 0 && out[out.length - 1].trim() === '') out.pop();
        out.push('');
        out.push('#### Parameters');
        out.push('');
      }
      // emit full table
      while (i < section.length && t(section[i]).startsWith('|')) {
        out.push(section[i]);
        i++;
      }
      out.push('');
      continue;
    }

    // Returns: normalize into a table
    if (t(line).startsWith('#### Returns')) {
      i++; // skip heading
      while (i < section.length && t(section[i]) === '') i++;
      if (i >= section.length) {
        out.push('#### Returns');
        break;
      }
      const typeLine = t(section[i] || '');
      i++;
      while (i < section.length && t(section[i]) === '') i++;

      const descParts: string[] = [];
      while (
        i < section.length &&
        t(section[i]) !== '' &&
        !/^#### /.test(t(section[i])) &&
        !/^### /.test(t(section[i]))
      ) {
        descParts.push(t(section[i]));
        i++;
      }

      let rawType = typeLine
        .replace(/`/g, '')
        .replace(/\\</g, '<')
        .replace(/\\>/g, '>');
      rawType = rawType.trim();
      const type = rawType.replace(/^Promise\s*<\s*([^>]+)\s*>$/i, '$1').trim();
      const desc = descParts.join(' ');

      out.push('#### Returns', '');
      out.push('| Type | Description |');
      out.push('|------|-------------|');
      out.push(`| \`${type}\` | ${desc || '-'} |`);
      out.push('');
      while (i < section.length && t(section[i]) === '') i++;
      continue;
    }

    // Throws: collect rows, defer emission; skip original throws blocks
    if (t(line).startsWith('#### Throws')) {
      if (firstThrowsOutIdx === null) firstThrowsOutIdx = out.length;
      i++; // skip heading
      while (i < section.length && t(section[i]) === '') i++;
      if (i >= section.length) break;

      if (t(section[i]).startsWith('|')) {
        // table form
        const table: string[] = [];
        while (i < section.length && t(section[i]).startsWith('|')) {
          table.push(section[i].trim());
          i++;
        }
        for (const r of table) {
          const cells = r.split('|').map((c) => c.trim());
          if (
            cells.length >= 4 &&
            cells[1] &&
            cells[2] &&
            !/^(-{2,}|Type)$/i.test(cells[1]) &&
            !/^(-{2,}|Description)$/i.test(cells[2])
          ) {
            const typeCell = cells[1].replace(/`/g, '').trim();
            const descCell = cells[2].trim();
            throwRows.push({ type: typeCell || '-', desc: descCell || '-' });
          }
        }
      } else {
        // freeform
        while (
          i < section.length &&
          t(section[i]) !== '' &&
          !/^#### /.test(t(section[i])) &&
          !/^### /.test(t(section[i]))
        ) {
          pushLineAsThrowRow(section[i]);
          i++;
        }
      }
      // skip blank lines after each throws block
      while (i < section.length && t(section[i]) === '') i++;
      continue;
    }

    // Default: copy line
    out.push(line);
    i++;
  }

  // Insert merged Throws table at the first encountered position (or append at end if not found)
  if (throwRows.length > 0) {
    const block: string[] = [];
    block.push('#### Throws', '');
    block.push('| Type | Description |');
    block.push('|------|-------------|');
    for (const r of throwRows) {
      block.push(`| \`${r.type || '-'}\` | ${r.desc || '-'} |`);
    }
    block.push('');

    const insertAt = firstThrowsOutIdx ?? out.length;
    out.splice(insertAt, 0, ...block);
  }

  return out;
}

// ---------- EXAMPLES -> admonition ----------
function transformExamples(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Match "#### Example" or "#### Examples"
    if (/^####\s+Examples?/.test(line)) {
      i++; // skip heading

      // Skip blank lines
      while (i < lines.length && lines[i].trim() === '') i++;

      // If next line is not a code fence, leave it alone
      if (i >= lines.length || !lines[i].trim().startsWith('```')) {
        out.push('#### Example');
        continue;
      }

      // Capture exactly one fenced code block
      const code: string[] = [];
      code.push(lines[i]); // opening ```
      i++;

      // Capture lines until closing ```
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i]);
        i++;
      }

      // Capture final ```
      if (i < lines.length) {
        code.push(lines[i]);
        i++;
      }

      // Emit MkDocs Material example block
      out.push('???+ example "Example"', '');
      for (const l of code) out.push('    ' + l); // indent
      out.push('');

      continue;
    }

    // Normalize 5# "##### Examples" to 4# earlier in processFile; also handle here just in case
    if (/^#####\s+Examples?/.test(line)) {
      out.push(line.replace(/^#####/, '####'));
      i++;
      continue;
    }

    out.push(line);
    i++;
  }

  return out.join('\n');
}

// ---------- Collapse overloaded methods: no-op to keep Call Signature blocks ----------
function collapseOverloadedMethods(text: string): string {
  return text;
}

// add runner to process all docs
function main() {
  const files = globSync(join(ROOT, '**/*.md'));
  for (const file of files) {
    processFile(file);
  }
}

main();
