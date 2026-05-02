# Maestro E2E flows

Five end-to-end scenarios the IMPLEMENTATION_PLAN T902 calls for. Each flow
is a self-contained YAML file that can be executed with the
[Maestro](https://maestro.mobile.dev/) CLI:

```bash
# Install (one-time):
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run a single flow:
maestro test __tests__/e2e/flows/onboarding.yaml

# Run the full suite (npm script):
npm run test:e2e
```

The flows use textual selectors so they survive style changes; if you
rename labels in the UI, update the matching `tapOn:` lines here.

For local runs, set up a fresh test account via Supabase Studio + log it
in once on the simulator before running the flows. The flows assume:

* App scheme = `nyamnyam`
* Default Korean locale
* `EXPO_PUBLIC_SUPABASE_URL` set to the local supabase stack
