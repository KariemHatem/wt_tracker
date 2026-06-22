// ../../node_modules/.pnpm/@angular+common@20.3.25_@angular+core@20.3.25_@angular+compiler@20.3.25_rxjs@7.8.2_zone.js@0.16.2__rxjs@7.8.2/node_modules/@angular/common/fesm2022/xhr.mjs
function parseCookieValue(cookieStr, name) {
  name = encodeURIComponent(name);
  for (const cookie of cookieStr.split(";")) {
    const eqIndex = cookie.indexOf("=");
    const [cookieName, cookieValue] = eqIndex == -1 ? [cookie, ""] : [cookie.slice(0, eqIndex), cookie.slice(eqIndex + 1)];
    if (cookieName.trim() === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}
var XhrFactory = class {
};

export {
  parseCookieValue,
  XhrFactory
};
//# sourceMappingURL=chunk-QKBJKYC2.js.map
