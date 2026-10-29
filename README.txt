INSIGHT VAULT
=============

A weekly rotation tool for quotes, insights, and lessons you want to
remember. Each Sunday, three entries are picked from your library and
shown for the week. Things you see often fade into the background.
Things you rarely see rise back up.

It is the opposite of spaced repetition: spaced forgetting.


HOW TO USE IT
-------------

THIS WEEK tab — your three entries for the week.

  skip · not now    Not feeling it this week. The entry comes back
                    sooner rather than later. Replaced with another
                    entry from your library.

  absorbed          You've got this one. It's sunk in. The entry
                    cools down hard and won't show up again for a
                    while.

  new week now      Itching to move on? Starts the next week early:
                    weights update exactly as on a normal Sunday and
                    you get three fresh picks. The upcoming Sunday
                    rotation is then skipped, so the new set lasts
                    until the Sunday after. See "Starting a week
                    early" below.

  reroll            Replaces "new week now" after you've used it.
                    Draws three new picks without touching weights.
                    Press it as often as you like.

  undo              Appears for 4 seconds after skip, absorb, new
                    week now, or reroll. Lets you take it back if you
                    misclicked.

  countdown         Top right of the week. Shows days until the next
                    rotation, and switches to a live HH:MM:SS clock
                    in the final 24 hours.


LIBRARY tab — every entry you have, sorted by likelihood of being
shown next (highest weight first).

  Add new insight   Type your quote, optionally add author and
                    source. Then either:
                      "add to this week"   shows it immediately
                      "add to library"     enters the rotation pool

  +                 Add an existing entry to this week's selections.
                    Works even on entries that have cooled to zero.

  ↻                 Resets an entry's weight back to 10 (only shows
                    if the weight is below 10).

  edit              Change the text, author, or source.

  ×                 Delete the entry permanently. Asks for
                    confirmation. Gone forever.


reset              Tiny link in the bottom-right corner of the
                   screen. Wipes your entire vault and starts fresh
                   with seed data. Two-tap confirm so you don't do
                   it by accident.


HOW IT REMEMBERS WHAT YOU'VE SEEN
---------------------------------

Every entry has a weight from 0 to 10. Higher weight = more likely
to be picked next Sunday. The weight changes based on what you do:

  Created new                        starts at 10
  Shown for the full week            -3
  Skipped                            -1.5
  Absorbed                           -5
  Not selected this week (passive)   +0.5
  Reset button                       back to 10

Floor is 0. Ceiling is 10. An entry at weight 0 cannot be picked at
all — it has to passively recover (+0.5/week) before it's eligible
again. So an absorbed entry takes at least one week to come back,
and even then with low probability.

This is intentional. Things you've absorbed should genuinely
disappear for a while. Things you skip get a softer cooldown.
Things you ignore drift slowly up.


HOW THE WEEKLY PICK WORKS
-------------------------

Rotation happens every Sunday at 00:00 (your local time, based on
when you next open the app after that boundary).

Three entries are chosen by weighted random selection from
everything with weight above 0. An entry with weight 8 is twice as
likely to be picked as one at weight 4. An entry at 10 is the most
likely. An entry at 0 is impossible.

Then weights update:
  - Last week's entries that you didn't skip or absorb: -3
  - Everything else (that wasn't added mid-week): +0.5


STARTING A WEEK EARLY
---------------------

"new week now" runs the same rotation as Sunday does (same weight
changes, same weighted pick) and puts the next Sunday rotation on
hold. When that Sunday arrives, the app just moves the "Week of"
date forward and keeps your current picks. Normal rotation resumes
the Sunday after.

The hold is a single on/off switch, not a counter, so it can never
skip more than one Sunday:

  - First press: real rotation, weights change, hold switched on.
    The button becomes "reroll".
  - Every press after that: new picks only. Weights don't change
    (otherwise mashing the button would drain your whole library),
    and the hold stays at one Sunday.
  - The weights for the picks you end up with are settled at the
    next real rotation, like any other week.


YOUR DATA
---------

Synced via a Google account, stored in Firestore. That means:

  - Sign in once per device. The same vault follows you — phone,
    laptop, wherever you're signed in.
  - Changes made on one device show up on your other open devices
    automatically (no refresh needed).
  - Works offline: a local cache keeps the app usable without a
    connection, and queued changes sync once you're back online.
  - Only your signed-in account can read or write your vault —
    enforced by Firestore security rules, not just app-side checks.

This replaced the earlier localStorage-only build (still in
legacy/index-standalone.html), where the vault was private to one
browser on one device with no sync. See SETUP.md for how the
Firebase project behind this is configured, and for how to bring
over entries from that older build if you were using it.


KNOWN QUIRKS
------------

  - The rotation only ticks when you have the app open. If you
    don't open it for three weeks, you get one rotation, not
    three. The app advances to the current week, it doesn't
    replay missed weeks.

  - The currently-displayed week info shows the Sunday the week
    started, not today's date.

  - Starting a week early near the start of a week makes that set
    last a long time. Press "new week now" on a Monday and the
    picks stay for about 13 days, because the coming Sunday is
    skipped.

  - If you start a week early and then don't open the app for more
    than a week, the hold is dropped and you get a normal rotation
    when you come back, rather than more of the old picks.

  - Rerolls can land on some of the same entries again. It's a
    weighted random draw, and nothing stops repeats.

  - The countdown doesn't trigger the rotation by itself. When it
    hits zero, the new week's picks appear the next time the app
    loads or your vault changes.


CREDITS
-------

Built by Sam, with Claude's help. The seed entries include some
of Claude's own observations from our conversations, plus a few
classics worth keeping around.

Feedback welcome. The whole point of this build is to find out
whether the rotation feels right or not.
