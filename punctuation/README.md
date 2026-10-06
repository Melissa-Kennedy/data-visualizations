# Punctuation Pals

**Lovable project: [lovable.dev/projects/bc399feb-7844-4b5b-af07-d893e0682c12](https://lovable.dev/projects/bc399feb-7844-4b5b-af07-d893e0682c12)**

A kid-friendly punctuation explorer for a grade 4 reader. Type a punctuation
mark (or its name, like "comma") and it shows up on a card that explains:

- **What it does:** a short job label and a plain-language definition.
- **How it feels:** three emojis, each paired with a feeling word, because
  emojis are how she connects with tone.
- **How it sounds:** a small line showing whether your voice goes up, down,
  louder or fades out, plus a four-step meter for how long to pause.
- **What it looks like in use:** an example sentence written on primary
  handwriting paper (solid top line, dashed midline, solid baseline), with
  the mark highlighted, and a tip.

All 12 marks are also listed as buttons at the bottom, and a "Surprise me"
button picks one at random.

## The 12 marks

Period, question mark, exclamation mark, comma, apostrophe, quotation marks,
colon, semicolon, hyphen, dash, ellipsis and parentheses.

## Friendly input checking

- Letters, numbers and emojis get a kind message explaining what punctuation is.
- `!!!` or `???` shows the single mark, with a note that one is enough.
- `....` shows the ellipsis (always three dots), and `--` shows the dash.
- Curly and straight quotes and apostrophes are both recognized.

## What's in this folder

| Path | What it is |
|---|---|
| [`prototype/`](./prototype) | The original single-file HTML version that the Lovable app was built from. No build step and no dependencies other than Google Fonts. Open `index.html` in a browser. |

The production app was built with [Lovable](https://lovable.dev) from the
prototype, and lives in the Lovable project linked above.

## Design notes

- **Fonts:** Fraunces for the big marks and headings, Lexend for the
  interface (it was designed to make reading easier), and Andika for the
  example sentences (made for beginning readers, with a classroom-style "a").
- **Color:** each mark has its own color, with matching light and dark modes.
- **Accessibility:** works at phone width, has visible keyboard focus, and
  turns off animation for anyone who has reduced motion switched on.
