# Store Screenshot Plan

5 screenshots × 2 locales (ko / en). The captions stay short (≤4 lines)
so they fit the 1242×2688 (iPhone 6.7") canvas without wrapping.

Suggested capture order — same order on Apple App Store and Google Play
so reviewers and users get the same narrative.

| # | Screen | Korean caption | English caption |
|---|--------|----------------|-----------------|
| 1 | Home — NextActionCard "normal" scenario | **다음 수유, 미리 알려드려요**\n시계 보지 마세요. 30분 전에 알림이 와요. | **Reminded before the next feed**\nNo more clock-watching. We tell you 30 min ahead. |
| 2 | Home — QuickLogGrid + active feed timer | **한 번 탭, 끝**\n수유·수면·기저귀 모두 한 번에. | **One-tap logging**\nFeed, sleep, diaper — all in one tap. |
| 3 | Records tab — Day view + edit modal | **타임라인 한눈에**\n도트를 길게 누르면 즉시 수정 가능. | **Your day at a glance**\nLong-press a dot to edit instantly. |
| 4 | Guide tab — Standards table + Personal comparison | **WHO 표준과 비교**\n월령별 수유·수면 표준을 우리 아기 패턴과 함께. | **Compared to WHO standards**\nAge-banded feed/sleep references vs. your baby's pattern. |
| 5 | Share tab — Caregiver list + invite card | **가족이 함께**\n남편·조부모와 같은 기록을 실시간으로 공유. | **Share with the family**\nReal-time sync with spouse and grandparents. |

Recommended canvas sizes (Expo screenshot tooling):

| Platform | Display | Resolution |
|---|---|---|
| iOS | iPhone 16 Pro Max (6.9") | 1320 × 2868 |
| iOS | iPhone 8 Plus (5.5") | 1242 × 2208 |
| iPad | iPad Pro 13" (M4) | 2064 × 2752 |
| Android | Phone | 1080 × 1920 |
| Android | 7" Tablet | 1200 × 1920 |
| Android | 10" Tablet | 1600 × 2560 |

Production process:

1. `eas build --profile preview --platform ios` (or android) → install on a clean device.
2. Seed the test account with a representative day's data via the
   sample SQL script `supabase/seed.sql` (TODO: add).
3. Use the captioned 1242 × 2688 master frames in Figma; export PNG at
   the platform-specific sizes.
