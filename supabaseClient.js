// supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente são lidas aqui.
// No Netlify, elas são injetadas de forma segura.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Inicializa o cliente Supabase.
// 'supabase' é o objeto que você vai usar para interagir com a base de dados.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);