grant update (virou_tarefa) on public.movimentacoes_novas to authenticated;

drop policy if exists movimentacoes_novas_mark_task on public.movimentacoes_novas;
create policy movimentacoes_novas_mark_task on public.movimentacoes_novas
for update to authenticated
using ((select public.current_user_is_app_member()))
with check ((select public.current_user_is_app_member()));
