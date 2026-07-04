# vgi-azure-node-auth

The Node/Bun MSAL token minter (app-only client-credentials) for
`@vgi-azure/graph-core`'s `TokenCache`. Cloudflare workers swap this for a `fetch`
POST; the cache contract is identical either way.
