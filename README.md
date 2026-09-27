# Payload 3.90: `apiKey` / `enableAPIKey` render as plain fields after generate, regenerate or revoke

Minimal reproduction: an **unmodified** `npx create-payload-app@latest -t website --db sqlite` scaffold (Payload **3.90.2**). Changes from the scaffold: `auth: { useAPIKey: true }` on `Users`, an env-switched `apiKey` / `enableAPIKey` field override in `src/collections/Users/index.ts`, this README, `.env.example`, and the screenshots in `docs/`.

Since 3.90.0 (commit `880d2e9`, "fix!: omit API keys from document reads"), the `APIKey` component in the auth block runs the generate / regenerate / revoke PATCH itself and then does `dispatchFields({ type: 'REMOVE', path: 'apiKey' })` and the same for `enableAPIKey` (`packages/ui/src/views/Edit/Auth/APIKey.tsx`). Those two form-state entries are where `customComponents.Field` lives: the base fields are declared with `admin.components.Field: false` (`packages/payload/src/auth/baseFields/apiKey/index.ts`), which the server renders as an empty `Field` slot so `RenderFields` draws nothing for them. Once the entries are removed, nothing refills them (no form-state round trip runs; `RenderField` reads `fields[path]?.customComponents?.Field`, gets `undefined`, and falls back to the default `CheckboxField` / `TextField`). Every one of those fields the user may read is then rendered a second time, as an ordinary editable input at the bottom of the form, until the page is reloaded.

- **Unmodified template** (`APIKEY_OVERRIDE=none`): a stray, unchecked **Enable API Key** checkbox appears under `Name` after Generate, and stays after Revoke. `apiKey` has `read: () => false`, so it stays hidden.
- **The override the docs recommend** (`APIKEY_OVERRIDE=docs`, the `create`/`update` example from `docs/fields/default-fields.mdx`): same checkbox, now labelled **Enable A P I Key**. The user's field is sanitized before the base fields are merged (`sanitizeCollection` sanitizes `fields` first, then `mergeBaseFields(fields, getBaseAuthFields(...))`), so its auto-generated `toWords` label overrides the base `label: ({ t }) => t('authentication:enableAPIKey')`. The `APIKey` component's own label reads the same config, so it says **Api Key** from the first render.
- **An override that also opens `read`** (`APIKEY_OVERRIDE=read`, what a "self or admin may read" setup looks like): both fields appear, a stray **Enable A P I Key** checkbox and a stray, editable **Api Key** text input. Typing into that input and saving PATCHes `apiKey` with the typed string and it becomes the working key (`Authorization: users API-Key <typed>` → 200), bypassing the generate flow.

## Run it

```sh
cp .env.example .env
pnpm install
APIKEY_OVERRIDE=none pnpm dev   # or docs | read
```

## Reproduce

1. Open `http://localhost:3000/admin`, create the first user, then open that user (`/admin/collections/users/1`).
2. Click **Generate new API key** → **Generate**. Look below the `Name` field:
   - `none`: an unchecked **Enable API Key** checkbox (`docs/none-after-generate.png`).
   - `docs`: the same checkbox labelled **Enable A P I Key** (`docs/docs-after-generate.png`).
   - `read`: that checkbox plus an empty, editable **Api Key** input (`docs/read-after-generate.png`).
3. Click **Revoke API key** → **Revoke**. The stray fields stay (`docs/none-after-revoke.png`, `docs/read-after-revoke.png`). **Regenerate** goes through the same `updateKey`, so it behaves the same.
4. Reload the page: the stray fields are gone.
5. Optional, `read` variant: type 24+ characters into the stray **Api Key** input, change `Name` so Save enables, click **Save**. The PATCH body carries `apiKey: "<typed>"`, and `curl -H "Authorization: users API-Key <typed>" http://localhost:3000/api/users/me` returns 200.

On 3.88.0 the auth block rendered the `enableAPIKey` checkbox and the `apiKey` input itself (`packages/ui/src/views/Edit/Auth/index.tsx`) and never removed them from form state, so there was nothing to fall back to.
