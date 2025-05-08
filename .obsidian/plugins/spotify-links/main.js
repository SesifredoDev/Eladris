var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ObsidianSpotifyPlugin
});
module.exports = __toCommonJS(main_exports);
var import_electron = __toESM(require("electron"));
var import_obsidian3 = require("obsidian");

// src/spotifyAPI.ts
var import_crypto = require("crypto");
var import_obsidian = require("obsidian");
var authEndpoint = "https://accounts.spotify.com/authorize";
var clientId = "f73730e86de14041b47fc683e619fd8b";
var scopes = ["user-read-currently-playing"];
var redirectUri = "obsidian://song-links-callback";
var generateRandomString = (length) => {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};
var sha256 = (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return (0, import_crypto.createHash)("SHA256").update(data).digest();
};
var base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};
var generateCodeChallenge = () => {
  const codeVerifier = generateRandomString(64);
  const hashed = sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);
  return { verifier: codeVerifier, challenge: codeChallenge };
};
var buildAuthUrlAndVerifier = () => {
  const { verifier, challenge } = generateCodeChallenge();
  const authUrl = new URL(authEndpoint);
  const params = {
    response_type: "code",
    client_id: clientId,
    scope: scopes.join(" "),
    code_challenge_method: "S256",
    code_challenge: challenge,
    redirect_uri: redirectUri
  };
  authUrl.search = new URLSearchParams(params).toString();
  return [authUrl.toString(), verifier];
};
var ok = (status) => {
  return status >= 200 && status <= 299;
};
var fetchToken = async (code, verifier, redirectUri2) => {
  const params = {
    url: "https://accounts.spotify.com/api/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri2,
      code_verifier: verifier
    }).toString()
  };
  const res = await (0, import_obsidian.requestUrl)(params);
  if (ok(res.status)) {
    return res.json;
  }
  return void 0;
};
var refreshToken = async (refreshToken2) => {
  const params = {
    url: "https://accounts.spotify.com/api/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken2,
      client_id: clientId
    }).toString()
  };
  const res = await (0, import_obsidian.requestUrl)(params);
  if (ok(res.status)) {
    return res.json;
  }
  return void 0;
};
var fetchCurrentSong = async (token) => {
  var _a, _b;
  const params = {
    url: "https://api.spotify.com/v1/me/player/currently-playing",
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const res = await (0, import_obsidian.requestUrl)(params);
  if (ok(res.status)) {
    try {
      const obj = res.json;
      if (obj.is_playing) {
        return { link: (_a = obj.item) == null ? void 0 : _a.external_urls.spotify, name: (_b = obj.item) == null ? void 0 : _b.name };
      }
    } catch (e) {
      console.error("Failed to parse response json in fetchCurrentSong: ", e);
      return void 0;
    }
  }
  return void 0;
};
var fetchProfile = async (accessToken) => {
  const params = {
    url: "https://api.spotify.com/v1/me",
    headers: {
      Authorization: "Bearer " + accessToken
    }
  };
  const res = await (0, import_obsidian.requestUrl)(params);
  if (ok(res.status)) {
    return res.json;
  }
  return void 0;
};

// src/tokenStorage.ts
var localStoragePrefix = "obsidian-song-links";
var tokenKey = `${localStoragePrefix}-token`;
var publicAvailabilityNoticeKey = `${localStoragePrefix}-notified-of-public-availability`;
var storeToken = (token) => {
  const { access_token, refresh_token, expires_in } = token;
  const expiresAt = Math.floor(Date.now() / 1e3) + expires_in;
  const authItems = {
    access_token,
    expiresAt,
    refresh_token
  };
  localStorage.setItem(tokenKey, JSON.stringify(authItems));
  return authItems;
};
var clearToken = () => {
  localStorage.removeItem(tokenKey);
};
var getToken = async () => {
  const tokenAsString = localStorage.getItem(tokenKey);
  if (tokenAsString === null) {
    return void 0;
  }
  let token = JSON.parse(tokenAsString);
  if (Object.values(token).some((value) => value == void 0)) {
    return void 0;
  }
  if (isExpired(token)) {
    const refreshedToken = await refreshToken(token.refresh_token);
    token = refreshedToken ? storeToken(refreshedToken) : token;
  }
  return token;
};
var isExpired = (token) => {
  return Math.floor(Date.now() / 1e3) > token.expiresAt;
};
var hasNotifiedPublicAvailability = () => {
  return Boolean(localStorage.getItem(publicAvailabilityNoticeKey));
};
var setHasNotifiedPublicAvailability = () => {
  try {
    localStorage.setItem(publicAvailabilityNoticeKey, "true");
  } catch (e) {
    console.error(e);
  }
};

// src/settings.ts
var import_obsidian2 = require("obsidian");

// src/spotify-user.svg
var spotify_user_default = '<!-- SVG Coppied from Spotify Web App -->\n<svg viewBox="0 0 24 24" width="24" height="24" fill="#7f7f7f"><path d="M10.165 11.101a2.5 2.5 0 0 1-.67 3.766L5.5 17.173A2.998 2.998 0 0 0 4 19.771v.232h16.001v-.232a3 3 0 0 0-1.5-2.598l-3.995-2.306a2.5 2.5 0 0 1-.67-3.766l.521-.626.002-.002c.8-.955 1.303-1.987 1.375-3.19.041-.706-.088-1.433-.187-1.727a3.717 3.717 0 0 0-.768-1.334 3.767 3.767 0 0 0-5.557 0c-.34.37-.593.82-.768 1.334-.1.294-.228 1.021-.187 1.727.072 1.203.575 2.235 1.375 3.19l.002.002.521.626zm5.727.657-.52.624a.5.5 0 0 0 .134.753l3.995 2.306a5 5 0 0 1 2.5 4.33v2.232H2V19.77a5 5 0 0 1 2.5-4.33l3.995-2.306a.5.5 0 0 0 .134-.753l-.518-.622-.002-.002c-1-1.192-1.735-2.62-1.838-4.356-.056-.947.101-1.935.29-2.49A5.713 5.713 0 0 1 7.748 2.87a5.768 5.768 0 0 1 8.505 0 5.713 5.713 0 0 1 1.187 2.043c.189.554.346 1.542.29 2.489-.103 1.736-.838 3.163-1.837 4.355m-.001.001z"></path></svg>';

// src/settings.ts
var DEFAULT_SETTINGS = {};
var SettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  async refreshProfile() {
    const token = await getToken();
    if (token !== void 0 && this.profile === void 0) {
      const profile = await fetchProfile(token.access_token);
      if (profile !== void 0) {
        this.profile = profile;
        this.display();
      } else {
        new import_obsidian2.Notice("\u274C Could not show profile");
      }
    }
  }
  display() {
    var _a, _b, _c, _d, _e, _f;
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Manage your connection to Spotify" });
    const stack = containerEl.createDiv({ cls: "stack" });
    this.refreshProfile();
    if (this.profile !== void 0) {
      const spotifyProfile = stack.createEl("div", { cls: "profile" });
      const imageUrl = (_c = (_b = (_a = this.profile) == null ? void 0 : _a.images) == null ? void 0 : _b[0]) == null ? void 0 : _c.url;
      if (imageUrl) {
        const image = spotifyProfile.createEl("img", {
          cls: "spotify-profile-img"
        });
        image.src = (_f = (_e = (_d = this.profile) == null ? void 0 : _d.images) == null ? void 0 : _e[0]) == null ? void 0 : _f.url;
      } else {
        const bg = spotifyProfile.createEl("div", {
          cls: "spotify-profile-no-img"
        });
        bg.innerHTML = spotify_user_default;
      }
      spotifyProfile.createEl("span", {
        text: this.profile.display_name,
        cls: "display-name"
      });
    }
    const buttons = containerEl.createDiv({ cls: "buttons" });
    if (this.profile === void 0) {
      new import_obsidian2.ButtonComponent(buttons).setButtonText("Connect Spotify").onClick(() => {
        this.plugin.openSpotifyAuthModal(() => this.display());
      });
    }
    if (this.profile !== void 0) {
      new import_obsidian2.ButtonComponent(buttons).setButtonText("Disconnect Spotify").setWarning().onClick(() => {
        clearToken();
        this.profile = void 0;
        this.display();
      });
    }
  }
};

// src/main.ts
var ObsidianSpotifyPlugin = class extends import_obsidian3.Plugin {
  constructor() {
    super(...arguments);
    // Inspired by:
    // - https://stackoverflow.com/questions/73636861/electron-how-to-get-an-auth-token-from-browserwindow-to-the-main-electron-app
    // - https://authguidance.com/desktop-apps-overview/
    // - https://stackoverflow.com/questions/64530295/what-redirect-uri-should-i-use-for-an-authorization-call-used-in-an-electron-app
    this.openSpotifyAuthModal = (onComplete) => {
      const [authUrl, verifier] = buildAuthUrlAndVerifier();
      const authWindow = new import_electron.default.remote.BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          webSecurity: false
        }
      });
      authWindow.loadURL(authUrl);
      authWindow.show();
      const accessTokenChannel = "access-token-response";
      authWindow.webContents.on(
        "will-navigate",
        async (event) => {
          const url = new URL(event.url);
          if (!url.href.startsWith(redirectUri)) {
            return;
          }
          const code = url.searchParams.get("code");
          const error = url.searchParams.get("error");
          const bail = (error2) => {
            new import_obsidian3.Notice("\u274C There was an issue signing you in");
            console.error("Error encountered during auth flow: " + error2);
            import_electron.default.remote.ipcMain.removeAllListeners(accessTokenChannel);
            authWindow.destroy();
          };
          if (error) {
            bail(error);
            return;
          }
          if (code === null) {
            bail("code not present");
            return;
          }
          const tokenResponse = await fetchToken(code, verifier, redirectUri);
          if (!tokenResponse) {
            bail("issue fetching token");
            return;
          }
          import_electron.default.ipcRenderer.send(accessTokenChannel, tokenResponse);
        }
      );
      import_electron.default.remote.ipcMain.once(
        accessTokenChannel,
        (event, token) => {
          storeToken(token);
          authWindow.destroy();
          onComplete == null ? void 0 : onComplete();
        }
      );
    };
    /** This is an `editorCallback` function which fetches the current song an inserts it into the editor. */
    this.insertSongLink = async (editor, view) => {
      const token = await getToken();
      if (token === void 0) {
        new import_obsidian3.Notice("\u{1F3B5} Connect Spotify in settings first");
        this.openSettingsPage();
        return;
      }
      const song = await fetchCurrentSong(token.access_token);
      if (song === void 0) {
        new import_obsidian3.Notice("\u274C No song playing");
        return;
      }
      const link = this.buildSongLink(song);
      editor.replaceSelection(link);
      new import_obsidian3.Notice("\u2705 Added song link");
    };
    /** Build a MD link to the song including attribution */
    this.buildSongLink = (song) => {
      return `[${song.name} on Spotify](${song.link})`;
    };
    /** Open Spotify Links settings page */
    this.openSettingsPage = () => {
      var _a, _b, _c, _d;
      (_b = (_a = this.app.setting) == null ? void 0 : _a.open) == null ? void 0 : _b.call(_a);
      (_d = (_c = this.app.setting) == null ? void 0 : _c.openTabById) == null ? void 0 : _d.call(_c, this.manifest.id);
    };
    // Temporary notification of public availability
    this.notifyPublicAvailability = () => {
      const shouldNotify = !hasNotifiedPublicAvailability();
      if (shouldNotify) {
        const link = document.createElement("a");
        link.appendText("Connect");
        link.onclick = () => this.openSettingsPage();
        const df = new DocumentFragment();
        df.appendText("\u{1F525} Song Links is now publicly available. ");
        df.appendChild(link);
        df.appendText(" your Spotify to start linking!");
        new import_obsidian3.Notice(df, 0);
        setHasNotifiedPublicAvailability();
      }
    };
  }
  /**
   * onload for the plugin. Simply load settings, add the plugins command, and register a SettingTab
   */
  async onload() {
    await this.loadSettings();
    this.addCommand({
      id: "insert-song-link",
      name: "Insert song link",
      editorCallback: this.insertSongLink
    });
    this.addSettingTab(new SettingTab(this.app, this));
    this.notifyPublicAvailability();
  }
  /**
   * onunload for the plugin. TODO: Anything?
   */
  onunload() {
  }
  /**
   * Default loadSettings from docs
   */
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  /**
   * Default saveSettings from docs
   */
  async saveSettings() {
    await this.saveData(this.settings);
  }
};

/* nosourcemap */