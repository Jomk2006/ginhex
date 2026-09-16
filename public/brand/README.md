Official GENHEX logo files, exactly as supplied (no regeneration/redesign):

  genhex-logo.jpeg   — full lockup (icon + "GENHEX" wordmark + tagline), square.
                        Used by <Logo variant="full" />, for placements roughly
                        160px+ tall where the wordmark is actually readable.
  genhex-icon.jpeg    — icon-only mark, cropped from genhex-logo.jpeg (a crop is
                        a container we own, not an edit to the artwork). Used by
                        <Logo /> (the default), which is every current call site
                        (nav, footer, auth pages) -- all in the 40-60px range,
                        where the full lockup's wordmark/tagline are illegible.

If a separate dark-background export or a true vector/transparent version ever
gets supplied, drop it in as genhex-logo-dark.* / genhex-icon.png and swap the
`src` in components/shared/logo.tsx.
