---
name: Orval hook param patterns
description: How Orval-generated hooks in this repo expect params and mutation args
---

## Rule
Generated query hooks take params **directly**, not wrapped in a `params` key:
- ✅ `useListSessions({ from, to })`
- ❌ `useListSessions({ params: { from, to } })`

Mutation hooks use `{ id }` for the resource identifier, not `{ userId }` or other field names:
- ✅ `updateUser.mutate({ id: userId, data })`
- ✅ `deleteUser.mutate({ id: userId })`
- ❌ `updateUser.mutate({ userId, data })`

**Why:** Orval generates the wrapper object shape from the OpenAPI path params. The generated types enforce this and TypeScript errors will appear if the wrong shape is used.

**How to apply:** Before using any generated hook, check the generated type in `lib/api-client-react/src/generated/api.schemas.ts` to confirm param field names.
