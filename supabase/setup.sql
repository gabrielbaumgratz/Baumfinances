-- Prumo: configuração do banco no Supabase.
-- Rode uma vez em: Supabase > SQL Editor > New query > colar > Run.
--
-- O Prumo NÃO guarda dados financeiros no servidor. O Supabase é usado só para
-- contas (e-mail, senha e verificação em 2 etapas). Por isso não há tabelas aqui.

-- Permite que o próprio usuário exclua a conta (direito de eliminação da LGPD, art. 18).
-- Só apaga a conta de quem está logado (auth.uid()) e exige a verificação em 2 etapas (aal2).
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    raise exception 'mfa required';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;
