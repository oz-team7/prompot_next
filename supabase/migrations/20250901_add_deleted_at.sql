-- 기존 테이블에 deleted_at 컬럼 추가
alter table prompt_ratings add column if not exists deleted_at timestamptz;
alter table prompt_comments add column if not exists deleted_at timestamptz;

-- RLS 정책 수정
drop policy if exists "모든 사용자가 별점을 볼 수 있음" on prompt_ratings;
create policy "모든 사용자가 별점을 볼 수 있음"
  on prompt_ratings for select
  using (deleted_at is null);

drop policy if exists "모든 사용자가 댓글을 볼 수 있음" on prompt_comments;
create policy "모든 사용자가 댓글을 볼 수 있음"
  on prompt_comments for select
  using (deleted_at is null);
