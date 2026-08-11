# Live QA polish — 2026-08-12

Live Beget testing found three issues after Challenge v1:

- desktop answer selection / wrong-answer re-render could visibly move the viewport;
- the large decorative CASE FILE sheet in the investigation hero read as a broken layout rather than useful decoration;
- Challenge creation returned 503 because two concurrent Supabase HEAD count requests could intermittently make one service-role request return 401.

Fixes:

- desktop interaction keeps the exact viewport position during select/hint and wrong-answer re-renders while correct answers may still move to the result;
- the decorative CASE FILE pseudo-sheet is removed and the circular hero stamp is hidden on narrow screens;
- unfinished short-case timers older than 90 minutes reset on a fresh session so idle gaps are not presented as solve time;
- Challenge rate checks run sequentially; case paths are normalized with a trailing slash; production Edge Function was deployed as version 2.
