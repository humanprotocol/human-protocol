# audio-qe

Audio transcription quality estimation library for Recording Oracle.

## Install

Consumed by the recording oracle as an editable path dependency:

```toml
audio-qe = {path = "libs/audio_qe", develop = true}
```

## Usage

Inputs are `Interval` sequences (ground truth vs annotator); the transcription text lives in
`Interval.extra[req.text_attribute]`.

```python
from audio_qe import Interval, TranscriptionRequirement, match_transcriptions

gt  = [Interval(id=0, start=0, stop=2000, label="speech", extra={"text": "hello world"})]
ds  = [Interval(id=1, start=0, stop=2000, label="speech", extra={"text": "hello word"})]
req = TranscriptionRequirement(text_attribute="text")   # WER, char-align, basic normalizer, join
report = match_transcriptions(gt, ds, req=req)
report.corpus_rate                                      # aggregate error rate
```

Entrypoints:

- `match_intervals(gs, ds, *, config)` - pairwise interval matching.
- `match_transcriptions(gt, ds, *, requirement)` - transcription matching.
- `compare(gt, ds, *, settings)` - interval and transcription matching.

### Choosing settings

`TranscriptionRequirement` has three orthogonal axes plus an optional binarizer:

- **`granularity`** - the unit errors are reported in. `WORD` → WER; `CHARACTER` → CER
  (use for CJK and other scripts without word boundaries).
- **`align`** - how the alignment runs. `CHAR` (default) aligns characters then rebuilds word
  edits, so it tolerates word-boundary disagreements (`sunday` vs `sun day`); `WORD` is the classic,
  word-level alignment with no boundary credit.
- **`metric`** - per-chunk cost. `EQUALITY` (default) is 0/1, i.e. classic WER/CER; `ERROR_RATE`
  is recall-shaped (partial credit for near misses); `NORMALIZED_LEV` is symmetric and bounded
  `[0, 1]` (use when neither side is the reference, e.g. inter-annotator agreement).
- **`threshold`** - binarizes a soft metric (`cost > threshold → 1`); no-op with `EQUALITY`.
  Under `CHARACTER` granularity all metrics degenerate to equality (characters are atomic).

**Normalizer presets** (applied to both texts before alignment):

- `NormalizerConfig(mode=NONE)` - passthrough.
- `NormalizerConfig(mode=BASIC)` - universal Unicode + case + whitespace fold (language-agnostic).
- `lang_preset(code)` - language-specific preset (`BASIC` plus per-language rules). Supported codes:
  `en, es, fr, de, it, pt, nl, pl, ru, tr, zh, ja, ko, hi, ar`. Unlisted languages fall back to
  `BASIC`.

`grouping.strategy`:
- `JOIN` (concatenate each group's text, then one alignment - default)
- `FILTER` (pair intervals by IoU first).

Recommended default for annotator-vs-GT review:
`granularity=WORD, align=CHAR, metric=EQUALITY` - boundary-tolerant WER.

## License

MIT. Ported from [CVAT](https://github.com/cvat-ai/cvat). See [LICENSE](LICENSE); source files
retain their `SPDX-License-Identifier: MIT`.
