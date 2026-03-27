-- ============================================================
-- Expand timer and turn preset options
-- ============================================================

-- Drop old CHECK constraints and add new ones with expanded values
alter table public.rooms drop constraint if exists rooms_turn_timer_check;
alter table public.rooms add constraint rooms_turn_timer_check check (turn_timer in (3, 5, 10, 15, 30, 60));

alter table public.rooms drop constraint if exists rooms_max_turns_check;
alter table public.rooms add constraint rooms_max_turns_check check (max_turns in (5, 10, 20, 30, 50, 100));
