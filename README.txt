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

  undo              Appears for 4 seconds after skip or absorb. Lets
                    you take it back if you misclicked.


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


YOUR DATA
---------

Lives in your browser's localStorage. That means:

  - Private to your browser. Nothing leaves your machine.
  - Per-device. Your phone and your laptop are separate vaults.
  - Per-browser. Chrome and Firefox on the same laptop are
    separate vaults.
  - Wiped if you clear browsing data for the site.
  - There is no sync, no account, no server.

If you want to back up or transfer your vault, open the browser's
DevTools console (F12 → Console) on the site and run:

  localStorage.getItem("insight-vault-data")

Copy the result somewhere safe. To restore later:

  localStorage.setItem("insight-vault-data", '<paste here>')


KNOWN QUIRKS
------------

  - First load takes a second or two while the JSX compiles in
    your browser. Subsequent loads are faster (cached).

  - The rotation only ticks when you have the app open. If you
    don't open it for three weeks, you get one rotation, not
    three. The app advances to the current week, it doesn't
    replay missed weeks.

  - The currently-displayed week info shows the Sunday the week
    started, not today's date.


CREDITS
-------

Built by Sam, with Claude's help. The seed entries include some
of Claude's own observations from our conversations, plus a few
classics worth keeping around.

Feedback welcome. The whole point of this build is to find out
whether the rotation feels right or not.
