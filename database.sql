-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.content_blocks (
  note_id uuid NOT NULL,
  type character varying NOT NULL,
  icon character varying,
  icon_color character varying,
  title character varying NOT NULL,
  content jsonb NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sort_order integer DEFAULT 0,
  CONSTRAINT content_blocks_pkey PRIMARY KEY (id),
  CONSTRAINT content_blocks_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id)
);
CREATE TABLE public.flashcards (
  note_id uuid NOT NULL,
  user_id uuid NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT flashcards_pkey PRIMARY KEY (id),
  CONSTRAINT flashcards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT flashcards_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id)
);
CREATE TABLE public.folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid NOT NULL,
  name character varying NOT NULL,
  color character varying,
  icon character varying,
  CONSTRAINT folders_pkey PRIMARY KEY (id),
  CONSTRAINT folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.notes (
  markdown text,
  user_id uuid NOT NULL,
  folder_id uuid,
  title character varying NOT NULL,
  source_type character varying NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content_status character varying DEFAULT 'draft'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  url text,
  transcription text,
  image_url text,
  CONSTRAINT notes_pkey PRIMARY KEY (id),
  CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT notes_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id)
);
CREATE TABLE public.quiz_answers (
  study_session_id uuid NOT NULL,
  quiz_question_id uuid NOT NULL,
  user_answer_index integer NOT NULL,
  is_correct boolean NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  answered_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_answers_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_answers_quiz_question_id_fkey FOREIGN KEY (quiz_question_id) REFERENCES public.quiz_questions(id),
  CONSTRAINT quiz_answers_study_session_id_fkey FOREIGN KEY (study_session_id) REFERENCES public.study_sessions(id)
);
CREATE TABLE public.quiz_questions (
  quiz_id uuid NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer_index integer NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sort_order integer DEFAULT 0,
  CONSTRAINT quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id)
);
CREATE TABLE public.quizzes (
  note_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title character varying NOT NULL,
  total_questions integer NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT quizzes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT quizzes_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id)
);
CREATE TABLE public.recordings (
  note_id uuid NOT NULL UNIQUE,
  audio_url text,
  audio_duration integer,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transcription_status character varying DEFAULT 'pending'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recordings_pkey PRIMARY KEY (id),
  CONSTRAINT recordings_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id)
);
CREATE TABLE public.study_sessions (
  user_id uuid NOT NULL,
  content_type character varying NOT NULL,
  content_id uuid NOT NULL,
  score integer,
  total_questions integer,
  completed_at timestamp with time zone,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  started_at timestamp with time zone DEFAULT now(),
  CONSTRAINT study_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT study_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.system_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  action character varying NOT NULL,
  details text,
  CONSTRAINT system_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transcriptions (
  note_id uuid NOT NULL UNIQUE,
  raw_text text,
  processed_text text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transcriptions_pkey PRIMARY KEY (id),
  CONSTRAINT transcriptions_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id)
);
CREATE TABLE public.users (
  email character varying NOT NULL UNIQUE,
  full_name character varying,
  avatar_url text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_guest boolean DEFAULT false,
  last_active_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);