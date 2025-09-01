-- 별점 테이블 생성
create table if not exists prompt_ratings (
    id uuid default uuid_generate_v4() primary key,
    prompt_id uuid references prompts(id) on delete cascade,
    user_id uuid references profiles(id) on delete cascade,
    rating integer check (rating >= 1 and rating <= 5),
    created_at timestamptz default now(),
    unique(prompt_id, user_id)
);

-- 댓글 테이블 생성
create table if not exists prompt_comments (
    id uuid default uuid_generate_v4() primary key,
    prompt_id uuid references prompts(id) on delete cascade,
    user_id uuid references profiles(id) on delete cascade,
    content text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz
);

-- 인덱스 생성
create index if not exists prompt_ratings_prompt_id_idx on prompt_ratings(prompt_id);
create index if not exists prompt_comments_prompt_id_idx on prompt_comments(prompt_id);

-- RLS 정책 설정
alter table prompt_ratings enable row level security;
alter table prompt_comments enable row level security;

-- 별점 RLS 정책
create policy "모든 사용자가 별점을 볼 수 있음"
    on prompt_ratings for select
    using (true);

create policy "인증된 사용자만 별점을 줄 수 있음"
    on prompt_ratings for insert
    with check (auth.uid() = user_id);

create policy "자신의 별점만 수정할 수 있음"
    on prompt_ratings for update
    using (auth.uid() = user_id);

create policy "자신의 별점만 삭제할 수 있음"
    on prompt_ratings for delete
    using (auth.uid() = user_id);

-- 댓글 RLS 정책
create policy "모든 사용자가 댓글을 볼 수 있음"
    on prompt_comments for select
    using (deleted_at is null);

create policy "인증된 사용자만 댓글을 작성할 수 있음"
    on prompt_comments for insert
    with check (auth.uid() = user_id);

create policy "자신의 댓글만 수정할 수 있음"
    on prompt_comments for update
    using (auth.uid() = user_id);

create policy "자신의 댓글만 삭제할 수 있음"
    on prompt_comments for delete
    using (auth.uid() = user_id);
