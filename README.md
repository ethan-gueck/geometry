# Geometry

The Geometry domain of [Ethan's NN](https://ethan-gueck.github.io/#nn): formulas built out as interactive pages, published at **https://ethan-gueck.github.io/geometry/**.

Flashcard decks in this track: Geometry. A neuron on the portfolio fills in once a topic here lists its card id in `cards`, and its **See how it works** button opens the topic's page.

## Topics

None yet: every neuron in this track shows its flashcard with **Coming soon**.

## Layout

```
geometry/
├── <topic>/                  one folder per topic (see "Adding a topic")
├── core/formula.py           every neuron's mathematics, in flashcard order (empty sections until built)
├── tests/test_site.py        the site builds; topic cards are flashcard ids
├── pyproject.toml            [tool.portfolio-site]: site title and URL
└── .github/workflows/pages.yml   test, build and deploy on every push to main
```

Themes, styles, the page builder and the static API come from the shared [portfolio-projects](https://github.com/ethan-gueck/portfolio-projects) library (`general/`), installed from git.

```bash
uv sync                                   # install into .venv
uv run pytest                             # tests
uv run python -m general serve --port 8001   # build _site/ and preview it at http://localhost:8001
uv lock --upgrade-package portfolio-projects # pick up changes to general/
```

## Adding a topic

1. **Write the mathematics** in that neuron's section of [`core/formula.py`](core/formula.py), the way it reads, with no input checks, rounding cleanup or formatting. This is the part to learn from; everything else is scaffolding.
2. **Build the page around it:** a topic folder (its name becomes the page's path, e.g. `https://ethan-gueck.github.io/geometry/<topic>/`) whose `solver.py` imports from `core.formula` and adds what the page needs, with `html/` (template, `<topic>_math.js` mirror, controller, CSS), `style.py`, `api.py` (`cards=("G.3",)`) and `tests/` (including the JS parity test). The [algebra repo](https://github.com/ethan-gueck/algebra) has worked examples.
   The "View the code" popup shows only the page's functions from `core/formula.py`: pass `code=(CodeFile(FORMULA, "…", only=MATH),)` to `render_page` and put `{{code_button}}` in the template.
3. Push to `main`. The workflow tests, builds and deploys, and the neuron fills in on the portfolio.
