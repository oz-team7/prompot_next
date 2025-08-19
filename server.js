import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

// Supabase 서버 클라이언트 생성
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// 헬스체크
app.get('/health', (_req, res) => res.json({ ok: true }));

// todos 목록 가져오기
app.get('/api/todos', async (_req, res) => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('id', { ascending: true })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// todo 추가
app.post('/api/todos', async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const { data, error } = await supabase
    .from('todos')
    .insert([{ title }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// todo 삭제
app.delete('/api/todos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });

  const { error } = await supabase.from('todos').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  res.status(204).send();
});

app.listen(process.env.PORT || 4000, () => {
  console.log(`API server running on :${process.env.PORT || 4000}`);
});
