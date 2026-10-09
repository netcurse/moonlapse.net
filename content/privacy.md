---
title: "Privacy policy"
description: "What Moonlapse keeps about you, why, who else sees it, and how to have it deleted."
---

*Last updated 9 October 2026.*

Moonlapse is a free game run as a hobby by two people in Australia. We're not a company, we don't make money from it, and we have no interest in your data beyond what it takes to run the game. This page says exactly what that is.

It covers this website (moonlapse.net), the sign-in service (auth.moonlapse.net), the server status feed (api.moonlapse.net) and the game server (play.moonlapse.net), which is also where the game can be played in a browser. Questions, or anything you'd like us to do with your information: <privacy@moonlapse.net>.

## The short version

- To play, you need an account. Its sign-in details are an **email address** and a password, or a Google or Discord account.
- We use your information to sign you in, keep your account safe, and run the game. Nothing else.
- We **never sell** it, never use it for advertising, never use it to train AI models, and never share it except with the services listed below that we need to run the game.
- No analytics, no trackers, no ads, on the website or in the game.
- You can delete your account yourself at any time, and your characters go with it.

## What we keep

### Your account

When you make an account at auth.moonlapse.net, we keep:

- your **email address**, and whether it's been verified;
- your **password**, if you set one, stored only as a one-way hash (we can't read it);
- your **passkeys**, if you add any: the public half only;
- if you sign in with **Google** or **Discord**, what we receive from them (below);
- the **IP addresses and browser details of recent sign-ins**, and a record of security events (sign-ins, password changes, failed attempts). These let us spot an attempt to get into your account, and send you an email when there's a sign-in from somewhere new;
- which devices are signed in, so you can see them and sign them out.

### Signing in with Google

If you choose **Sign in with Google**, Google tells us, with your permission:

- your email address, and whether Google has verified it;
- your name as it appears on your Google account, and the address of your profile picture;
- an ID that identifies your Google account to us.

We ask only for these (the `openid`, `email` and `profile` scopes). We don't get your Google password, and we can't see your contacts, files, mail or anything else in your Google account.

We use this information only to **create your account and sign you in**: the email address becomes your account's address, and the ID lets us recognise you next time. We don't use it for anything else, don't share it with anyone, and don't transfer it except as the law requires. It's stored with the rest of your account (below) and deleted with it.

Moonlapse's use and transfer of information received from Google APIs adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.

You can stop Moonlapse receiving anything further from Google at any time from your [Google account's connections page](https://myaccount.google.com/connections), and unlink Google from your account page at auth.moonlapse.net.

### Signing in with Discord

If you choose **Sign in with Discord**, Discord tells us, with your permission, your Discord username and user ID, your avatar, and your email address (the `identify` and `email` scopes). We use and keep it exactly as we do Google's, above, and you can remove our access from Discord's settings under *Authorized Apps*.

### Your characters

An account can have several characters. For each one, the game keeps what it needs to remember where you left off: its name, where it is, its skills, inventory, bank, equipment, quests, and the in-game mail it has sent and received, along with when you last played it. Other players can see your characters' names and what they do in the game, as in any multiplayer game.

If you delete a character by itself, the game keeps it for 30 days so you can restore it. Then it's deleted for good, with its items, bank, quests and mail, and the letters it sent that other players still have, with anything attached to them. You can also choose to delete it for good straight away.

We don't keep a record of chat.

### When you connect

Your computer's **IP address** is seen by every server you connect to, ours included:

- **The game server** needs it to talk to your client while you play. It doesn't write it down. When you join, the client also sends the game server your sign-in token, which includes your email address: the game server checks the token, but doesn't keep or log the address.
- **The sign-in service, the status feed and the browser version of the game** (play.moonlapse.net) sit behind a web server that keeps ordinary access logs (IP address, time, what was asked for, browser details) for about two weeks, for troubleshooting and to deal with abuse. For the browser version, that includes its connection to the game. The game server itself still doesn't write your IP address down, and the sign-in token works just as it does for the client you download.
- **This website** is hosted by GitHub Pages, and the game's downloads by GitHub. GitHub sees your IP address when you visit or download, and handles it under the [GitHub General Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement). We don't receive it.

### What the client keeps on your computer

If you tick *Stay signed in*, the game client saves a sign-in token in a file next to it, so you don't have to sign in every time. The token includes your email address, and the title screen shows it (*Continue as* your address), so anyone who uses that computer and that copy of the client can see it. It's on your computer, not ours: choosing *Sign out* deletes it.

The browser version at play.moonlapse.net works the same way, but keeps things in your browser's storage for play.moonlapse.net instead of a file:

- If you tick *Stay signed in*, it keeps your sign-in token there, including your email address, and the title screen shows it (*Continue as* your address) to anyone using that browser. Choosing *Sign out*, or clearing the site's data in your browser, deletes it.
- If you don't, the token is kept only while the page is open.
- While you're signing in, the tab keeps a one-time code for a moment, and discards it when you come back.

## Cookies

The website uses **no cookies**, and neither does the browser version of the game: it uses only the browser storage described above. Its fonts and images come from moonlapse.net itself, not from other companies, and it asks api.moonlapse.net for the server's status (how many are playing, the in-game time), which sends nothing about you.

The sign-in service uses a few cookies that it needs to work: to keep you signed in to your account page and to protect the sign-in forms from forgery. They aren't used for anything else, and nothing tracks you between sites.

## Who else handles it

We run the game, the sign-in service and their database on a server of our own in Australia. A few other services are involved, each seeing only what it needs:

| Who | What for | What they see |
|---|---|---|
| [Amazon Web Services](https://aws.amazon.com/privacy/) | Sending account emails (verification, password resets, new sign-in warnings), from Sydney | Your email address and the email's contents |
| [Google](https://policies.google.com/privacy) | *Sign in with Google*, if you use it | That you're signing in to Moonlapse |
| [Discord](https://discord.com/privacy) | *Sign in with Discord*, if you use it | That you're signing in to Moonlapse |
| [GitHub](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) | Hosting this website and the downloads | Your visit, as above |

We'd only ever give your information to anyone else if the law required us to.

## How long we keep it

- **Your account and characters**: until you delete them, or until Moonlapse shuts down. A character you delete by itself is kept for 30 days so you can restore it, then deleted for good.
- **Sign-in records and security events**: no longer than they're useful for keeping accounts safe, and never longer than your account.
- **Web server logs**: about two weeks.
- **Backups** of the database: kept for 14 days, then deleted. Something you delete can stay in a backup until it ages out, and backups are only ever used to restore the game after a failure.

## Deleting your account

Sign in at [auth.moonlapse.net](https://auth.moonlapse.net/auth/v1/account) and delete your account from your account page. That deletes your sign-in details straight away, and the game deletes every one of your characters with it, including any you've deleted and could still restore: their items, bank, quests and mail. There are no 30 days to wait. Mail your characters sent to other players is deleted with them.

If you can't sign in any more, email <privacy@moonlapse.net> from the address on the account and we'll do it for you.

## Your choices

You can see and change your email address, password, passkeys and linked Google or Discord account on your account page at any time. Email us if you'd like:

- a copy of what we hold about you;
- something corrected;
- your account deleted (or do it yourself, above);
- to ask anything about this policy.

We'll reply within 30 days, and usually much sooner. If you're not happy with our answer, you can complain to the privacy regulator where you live; in Australia, that's the [Office of the Australian Information Commissioner](https://www.oaic.gov.au/).

## Security

Every connection to the website, the sign-in service, the status feed and the browser version of the game, including the browser version's connection to the game, is encrypted (HTTPS). Passwords are hashed with Argon2, the database isn't reachable from the internet, and only the two of us can get to it. No system is perfectly secure, though: if something ever went wrong that affected your information, we'd tell you by email.

## Children

You need to be at least 13 to make an account. If you're under 18, check with a parent or guardian first. If we learn that someone under 13 has made an account, we'll delete it. If you think that's happened, email <privacy@moonlapse.net>.

## Changes

If this policy changes, we'll update it here, with a new date at the top. If a change affects how we use information we already have, we'll email account holders before it takes effect.

See also the [terms of use](/terms/).
