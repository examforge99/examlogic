create or replace function public.create_exam_session(
  p_user_id text,
  p_mode text,
  p_status text,
  p_total_questions integer,
  p_time_limit_seconds integer,
  p_started_at timestamptz,
  p_expires_at timestamptz,
  p_questions jsonb
)
returns public.exam_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.exam_sessions;
  v_question_count integer;
begin
  v_question_count := jsonb_array_length(p_questions);

  if v_question_count <> p_total_questions then
    raise exception using
      errcode = '22023',
      message = 'Session question count does not match total_questions';
  end if;

  insert into public.exam_sessions (
    user_id,
    mode,
    status,
    is_completed,
    total_questions,
    correct_count,
    total_time_seconds,
    base_points,
    bonus_points,
    total_points,
    gems_earned,
    is_flagged,
    missed_heartbeats,
    total_absence_events,
    auto_submitted,
    started_at,
    expires_at
  )
  values (
    p_user_id,
    p_mode,
    p_status,
    false,
    p_total_questions,
    0,
    p_time_limit_seconds,
    0,
    0,
    0,
    0,
    false,
    0,
    0,
    false,
    p_started_at,
    p_expires_at
  )
  returning * into v_session;

  insert into public.exam_session_questions (
    session_id,
    question_id,
    subject_id,
    topic_id,
    difficulty_level,
    position
  )
  select
    v_session.id,
    (q->>'questionId')::uuid,
    (q->>'subjectId')::uuid,
    (q->>'topicId')::uuid,
    (q->>'difficultyLevel')::integer,
    (q->>'position')::integer
  from jsonb_array_elements(p_questions) q;

  return v_session;
end;
$$;

revoke execute on function public.create_exam_session(
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  jsonb
) from public, anon, authenticated;

grant execute on function public.create_exam_session(
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  jsonb
) to service_role;
