---
title: "Download"
description: "The Moonlapse client for Windows, macOS and Linux, or play in your browser."
---

{{< platforms >}}
{{< platform id="windows-x64" >}}
In PowerShell, or better, [Windows Terminal](https://aka.ms/terminal), which draws it best:

{{< commands lang="powershell" >}}
curl.exe -fLO {url}
tar -xf {file}
cd {dir}
.\moonlapse.exe
{{< /commands >}}

Next time, just the last two lines. Or download it with the button, right-click the `.zip`, choose **Extract All…**, and double-click `moonlapse.exe` in the folder.

The client isn't signed yet, so if you download it in your browser, SmartScreen may say *Windows protected your PC* the first time. Click **More info**, then **Run anyway**.
{{< /platform >}}
{{< platform id="macos-arm64" >}}
In Terminal:

{{< commands >}}
curl -fL {url} | tar -xzf -
cd {dir}
./moonlapse
{{< /commands >}}

Next time, just the last two lines.

The client isn't signed yet. Downloaded with `curl` it runs as it is, but if you download it in your browser, macOS quarantines it, so unpack it in Finder and let it run:

{{< commands >}}
cd ~/Downloads/{dir}
xattr -dr com.apple.quarantine .
./moonlapse
{{< /commands >}}
{{< /platform >}}
{{< platform id="linux-x64" >}}
In a terminal:

{{< commands >}}
curl -fL {url} | tar -xzf -
cd {dir}
./moonlapse
{{< /commands >}}

Next time, just the last two lines.

The client needs ncurses, which almost every distribution has already (on Debian or Ubuntu it's `libncursesw6`). If it complains about `GLIBC`, your distribution's glibc is older than the one it needs (above).
{{< /platform >}}
{{< platform id="browser" name="Browser" >}}
Nothing to download: it's the same client, running in your browser, in the same world, with the same account and characters. It's updated with the server, so it's always the latest version. Tick *Stay signed in* and that browser remembers you; *Sign out* forgets it.

The terminal is still the best way to play: it draws faster and feels snappier, and it's your own terminal, font and colours. The browser is the quickest way in.
{{< /platform >}}
{{< /platforms >}}

## Good to know

{{< details summary="What's in the archive" >}}
The client, its game data (`content/`) and a `config.toml` that points it at the live server, {{< server >}}. There's no installer: unpack the folder wherever you like and keep everything in it together.
{{< /details >}}

{{< details summary="Your account" >}}
You'll sign in through your browser the first time you play, with an email, Google or Discord: no separate sign-up. Or choose *Play as guest* to play with no account at all, and register later to keep your character ([playing as a guest](/guide/#playing-as-a-guest)). Your [account page](https://auth.moonlapse.net/auth/v1/account) is where you change your password, link Google or Discord, or delete your account.
{{< /details >}}

{{< details summary="Passkeys" >}}
You can add a passkey on your [account page](https://auth.moonlapse.net/auth/v1/account) and sign in with it instead of a password. *Passkey Type* starts on **Resident Key**, which the **Passkey** button on the sign-in page finds, with nothing to type. The red caution under it is about hardware keys such as a YubiKey, which hold only a few of these: a passkey kept by your password manager, phone or computer can ignore it. If your hardware key is nearly full, choose *Default*.

A *Default* passkey works too, but the **Passkey** button can't find it: type your email address (and your password, if your account has one) and press **Sign in**, and you'll be asked for the passkey. The sign-in page remembers your email address after the first time.

Passkeys added before 20 October 2026 started on *Default*. If the **Passkey** button can't find yours, delete it on your account page, then add it again.
{{< /details >}}

{{< details summary="Staying signed in" >}}
Tick *Stay signed in* on the title screen and the client keeps your sign-in in `session.toml`, next to itself, so next time you can *Continue as* your email address. *Sign out* deletes it.
{{< /details >}}

{{< details summary="Updating" >}}
When a new version comes out, the title screen says *update available*. Download the new archive and replace the old folder: your characters live on the server, so there's nothing to carry over. If you play as a guest, copy `guest.toml` across first: it's your only way back to your guest.
{{< /details >}}

{{< details summary="Which terminal" >}}
Any modern terminal works, and the bigger the window, the more of the world you see. A font with good box-drawing characters looks best.
{{< /details >}}

{{< details summary="Playing on another server" >}}
`config.toml` holds the server's address, or use `--host` and `--port` for one run. `moonlapse --help` lists the options.
{{< /details >}}
