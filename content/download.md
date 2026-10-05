---
title: "Download"
description: "The Moonlapse client for Windows, macOS and Linux."
---

{{< downloads >}}

Each archive holds the client, its game data (`content/`) and a `config.toml` that points it at the live server, {{< server >}}. There's no installer and nothing else to install: unpack the folder wherever you like, and keep everything in it together.

## Windows

1. Right-click the `.zip` and choose **Extract All…**
2. Open the folder and double-click `moonlapse.exe`, or run it from [Windows Terminal](https://aka.ms/terminal), which draws it best:

   ```powershell
   cd moonlapse-*-windows-x64
   .\moonlapse.exe
   ```

The client isn't signed yet, so the first time, SmartScreen may say *Windows protected your PC*. Click **More info**, then **Run anyway**.

## macOS

Unpack the archive (double-click it in Finder), then in Terminal:

```sh
cd ~/Downloads/moonlapse-*-macos-arm64
xattr -dr com.apple.quarantine .
./moonlapse
```

The client isn't signed yet, so macOS quarantines it when it's downloaded: the `xattr` line lets it run. You only need it once per download. The macOS build is for Apple Silicon (M1 and later).

## Linux

```sh
tar -xzf moonlapse-*-linux-x64.tar.gz
cd moonlapse-*-linux-x64
./moonlapse
```

The client needs ncurses, which almost every distribution has already (on Debian or Ubuntu it's `libncurses6`). If it complains about `GLIBC`, your distribution is older than the one it was built on: the release notes say which glibc it needs.

## Updating

When a new version comes out, the title screen says *update available* beside the version number. If the server has moved on too far for your client, it'll tell you when you try to connect. Either way, download the new archive and replace the old folder with it: your account and character live on the server, so there's nothing to carry over.

## Good to know

- **The terminal matters.** Any modern terminal works. The bigger the window, the more of the world you see. A font with good box-drawing characters looks best.
- **Playing somewhere else.** `config.toml` holds the server's address. You can also point the client somewhere else for one run with `--host` and `--port`. `moonlapse --help` lists the options and `moonlapse --version` prints the version.
- **Remember me.** If you tick *Remember username* on the login screen, the client saves your username (never your password) to `login.toml`, next to itself.
