-- Execute este código no SQL Editor do seu projeto Supabase

-- 1. Cria ou atualiza a tabela measurements
CREATE TABLE IF NOT EXISTS measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" UUID NOT NULL,
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  pulse INTEGER,
  period TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Habilita o RLS (Row Level Security)
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

-- 3. Remove políticas antigas caso existam, para evitar duplicação (opcional)
DROP POLICY IF EXISTS "Usuários podem ver suas próprias medições" ON measurements;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias medições" ON measurements;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias medições" ON measurements;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias medições" ON measurements;

-- 4. Cria as políticas de segurança (RLS Policies)
-- Permite SELECT apenas para os dados do próprio usuário logado
CREATE POLICY "Usuários podem ver suas próprias medições" 
ON measurements FOR SELECT 
USING (auth.uid() = "userId");

-- Permite INSERT apenas se o userId enviado for o do usuário logado
CREATE POLICY "Usuários podem inserir suas próprias medições" 
ON measurements FOR INSERT 
WITH CHECK (auth.uid() = "userId");

-- Permite DELETE apenas para as próprias medições
CREATE POLICY "Usuários podem deletar suas próprias medições" 
ON measurements FOR DELETE 
USING (auth.uid() = "userId");

-- Permite UPDATE apenas para as próprias medições
CREATE POLICY "Usuários podem atualizar suas próprias medições" 
ON measurements FOR UPDATE 
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");

-- 5. Habilita o realtime para a tabela measurements (necessário para a atualização ao vivo pelo channel)
alter publication supabase_realtime add table measurements;
