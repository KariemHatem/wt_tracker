import { setAuthTokenGetter } from "@workspace/api-client-react";

export function setupApi() {
  setAuthTokenGetter(() => {
    return localStorage.getItem("wt_token");
  });
}