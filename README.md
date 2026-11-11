# vdh.ai

Personal site of Mathieu Van der Haegen. Static HTML/CSS/JS: no framework, no build step, no cookies, no trackers.
Hosted for free on GitHub Pages.

## Edit content

Almost everything lives in **`assets/js/data.js`**:

- `COMMITS`: the career `git log` (companies = branches, exits = merges). Newest first; `lane` is the graph column.
- `NOTES`: the posts shown under `~/notes` (Markdown-ish: blank lines between paragraphs, `- ` lists, `## ` headings).
- `PERSON`: email, socials, company address.

The hero text and `README.md` block are plain HTML in `index.html`.

## Preview locally

```sh
python3 -m http.server 4173
# open http://127.0.0.1:4173
```

## Deploy

Push to `main`. GitHub Pages serves the repo root. The `CNAME` file holds the custom domain.

## Files

| path | what |
| --- | --- |
| `assets/js/ascii.js` | real-time ASCII raymarcher (the 3D thing in the hero) |
| `assets/js/gitlog.js` | career graph + `git show` panel |
| `assets/js/notes.js` | `ls -l` notes list + `less`-style reader |
| `assets/js/term.js` | the terminal (press `~`) |
| `assets/js/main.js` | wiring: themes, scramble, clock, easter eggs |
| `404.html` | 404 page + redirects from the old Squarespace URLs |

Font: [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (SIL Open Font License), self-hosted.
