// @vgi-azure/node-auth — the Node/Bun MSAL token minter for graph-core's TokenCache.
// App-only (client-credentials). Cloudflare workers swap this for a fetch POST to
// the token endpoint; graph-core's cache/contract is identical either way.

import { ConfidentialClientApplication } from "@azure/msal-node";
import {
  AUDIENCE_SCOPE,
  AuthError,
  type AadCredential,
  type Audience,
  type MintedToken,
  type TokenMinter,
} from "@vgi-azure/graph-core";

export function makeMsalMinter(): TokenMinter {
  const apps = new Map<string, ConfidentialClientApplication>();
  return {
    async mint(cred: AadCredential, audience: Audience): Promise<MintedToken> {
      if (!cred.clientSecret) {
        throw new AuthError("secret missing client_secret (app-only client-credentials required)");
      }
      const key = `${cred.tenantId}|${cred.clientId}`;
      let app = apps.get(key);
      if (!app) {
        app = new ConfidentialClientApplication({
          auth: {
            clientId: cred.clientId,
            authority: `https://login.microsoftonline.com/${cred.tenantId}`,
            clientSecret: cred.clientSecret,
          },
        });
        apps.set(key, app);
      }
      const res = await app.acquireTokenByClientCredential({ scopes: [AUDIENCE_SCOPE[audience]] });
      if (!res?.accessToken) throw new AuthError("client-credential acquisition returned no token");
      return {
        token: res.accessToken,
        expiresAtMs: res.expiresOn ? res.expiresOn.getTime() : Date.now() + 3_600_000,
        audience,
      };
    },
  };
}

/**
 * Build the standard clientFactory a worker hands to its table functions: maps an
 * attached `azure_graph`/`azure_arm` secret dict → an authenticated GraphClient for
 * the given audience, all sharing one process-wide TokenCache.
 */
export { makeMsalMinter as default };
