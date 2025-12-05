import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { globSync } from 'glob';
import { PathOrFileDescriptor } from 'fs';

const ROOT = 'docs'; // adjust if needed

function processFile(path: PathOrFileDescriptor) {
  const original = readFileSync(path, 'utf8');
  const lines = original.split('\n');
  const out = [];

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ---------- THROWS: merge all into one table ----------
    if (line.startsWith('#### Throws')) {
      const rows = [];

      // consume all consecutive "#### Throws" sections
      while (i < lines.length && lines[i].startsWith('#### Throws')) {
        i++; // skip heading

        // skip blank lines
        while (i < lines.length && lines[i].trim() === '') i++;

        if (i >= lines.length || /^###? /.test(lines[i])) break;

        const first = lines[i].trim();
        i++;

        let type = '';
        let desc = '';

        // pattern: ErrorType Some description...
        const m = first.match(/^`?([^`\s]+)`?\s*(.*)$/);
        if (m) {
          type = m[1].trim();
          desc = (m[2] || '').trim();
        } else {
          desc = first;
        }

        // if description is empty, read following lines
        if (!desc) {
          const descParts = [];
          while (
            i < lines.length &&
            lines[i].trim() !== '' &&
            !/^###? /.test(lines[i])
          ) {
            descParts.push(lines[i].trim());
            i++;
          }
          desc = descParts.join(' ');
        }

        // skip blank lines between throws blocks
        while (i < lines.length && lines[i].trim() === '') i++;

        rows.push({ type, desc });
      }

      // emit one table
      out.push('#### Throws', '');
      out.push('| Type | Description |');
      out.push('|------|-------------|');
      for (const r of rows) {
        out.push(`| \`${r.type}\` | ${r.desc || '-'} |`);
      }
      out.push('');
      continue;
    }

    // ---------- RETURNS: single table ----------
    if (line.startsWith('#### Returns')) {
      i++; // skip heading

      // skip blank lines
      while (i < lines.length && lines[i].trim() === '') i++;

      if (i >= lines.length) {
        out.push('#### Returns');
        break;
      }

      // type line: `Promise`\<`EscrowClient`\>
      const typeLine = lines[i].trim();
      i++;

      // skip blank lines
      while (i < lines.length && lines[i].trim() === '') i++;

      // description lines until next heading or blank+heading
      const descParts = [];
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !/^###? /.test(lines[i])
      ) {
        descParts.push(lines[i].trim());
        i++;
      }

      // clean type: remove backticks and backslash escapes
      let rawType = typeLine
        .replace(/`/g, '')
        .replace(/\\</g, '<')
        .replace(/\\>/g, '>');
      rawType = rawType.trim(); // e.g. Promise<EscrowClient>

      // OPTIONAL: strip Promise<...> wrapper so only EscrowClient appears
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

    // default: copy line
    out.push(line);
    i++;
  }

  writeFileSync(path, out.join('\n'));
}

function main() {
  const files = globSync(join(ROOT, '**/*.md'));
  for (const file of files) {
    processFile(file);
  }
}

main();
