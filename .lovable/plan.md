## Problem
The Engine Assistant chatbox was shortened in a prior change (`calc(48vh + 60px)`). User feedback indicates it now feels too cramped, especially when the suggestion cards appear.

## Solution
Increase the chat container height so it is noticeably taller and better balanced with the adjacent 3D viewport (`58vh`).

### Change
In `src/pages/Configurator.tsx`, line ~203, update the chat `motion.aside` inline height style:

- From: `height: "calc(48vh + 60px)"`
- To:   `height: "calc(62vh + 80px)"`

This makes the chatbox roughly 4-5 cm taller on a typical desktop viewport, giving the messages and suggestion grid more breathing room while keeping the overall layout balanced.