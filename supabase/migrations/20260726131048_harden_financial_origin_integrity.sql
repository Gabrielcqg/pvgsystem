-- Keep financeiro traceability strict: generated lancamentos must point to
-- existing source rows. Existing broken parcel origins are downgraded to
-- manual entries so no money disappears during the hardening migration.
--
-- Rollback notes:
--   drop trigger if exists lancamentos_validate_origin_reference on public.lancamentos;
--   drop trigger if exists parcelas_prevent_delete_with_lancamento on public.parcelas;
--   drop function if exists private.validate_lancamento_origin_reference();
--   drop function if exists private.prevent_delete_parcela_with_lancamento();
-- The data repair below is intentionally non-destructive and does not need a
-- rollback to restore deleted rows.

update public.lancamentos l
set origem = 'manual',
    origem_id = null,
    observacoes = concat_ws(
      E'\n',
      nullif(l.observacoes, ''),
      '[integridade] Origem de parcela removida por migration: parcela inexistente.'
    )
where l.origem = 'parcela'
  and (
    l.origem_id is null
    or not exists (
      select 1
      from public.parcelas p
      where p.id::text = l.origem_id
    )
  );

create or replace function private.validate_lancamento_origin_reference()
returns trigger
language plpgsql
as $$
declare
  parcela_uuid uuid;
  parcela_contrato uuid;
  custo_uuid uuid;
  custo_key text;
begin
  if new.origem is null then
    new.origem := 'manual';
  end if;

  if new.origem = 'manual' then
    return new;
  end if;

  if new.origem_id is null or btrim(new.origem_id) = '' then
    raise exception 'lancamento de origem % precisa de origem_id', new.origem
      using errcode = '23503';
  end if;

  if new.origem = 'parcela' then
    begin
      parcela_uuid := new.origem_id::uuid;
    exception when invalid_text_representation then
      raise exception 'origem_id de parcela invalido: %', new.origem_id
        using errcode = '23503';
    end;

    select p.contrato_id
      into parcela_contrato
      from public.parcelas p
     where p.id = parcela_uuid;

    if parcela_contrato is null then
      raise exception 'lancamento referencia parcela inexistente: %', new.origem_id
        using errcode = '23503';
    end if;

    if new.contrato_id is null then
      new.contrato_id := parcela_contrato;
    elsif new.contrato_id <> parcela_contrato then
      raise exception 'lancamento de parcela precisa usar o contrato da parcela'
        using errcode = '23514';
    end if;

    return new;
  end if;

  if new.origem = 'custo_fixo' then
    custo_key := split_part(new.origem_id, ':', 1);
    begin
      custo_uuid := custo_key::uuid;
    exception when invalid_text_representation then
      raise exception 'origem_id de custo fixo invalido: %', new.origem_id
        using errcode = '23503';
    end;

    if not exists (select 1 from public.custos_fixos c where c.id = custo_uuid) then
      raise exception 'lancamento referencia custo fixo inexistente: %', new.origem_id
        using errcode = '23503';
    end if;

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists lancamentos_validate_origin_reference on public.lancamentos;
create trigger lancamentos_validate_origin_reference
before insert or update of origem, origem_id, contrato_id
on public.lancamentos
for each row
execute function private.validate_lancamento_origin_reference();

create or replace function private.prevent_delete_parcela_with_lancamento()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.lancamentos l
    where l.origem = 'parcela'
      and l.origem_id = old.id::text
  ) then
    raise exception 'estorne a parcela antes de excluir'
      using errcode = '23503';
  end if;
  return old;
end;
$$;

drop trigger if exists parcelas_prevent_delete_with_lancamento on public.parcelas;
create trigger parcelas_prevent_delete_with_lancamento
before delete on public.parcelas
for each row
execute function private.prevent_delete_parcela_with_lancamento();

create index if not exists ix_lancamentos_origem_id
  on public.lancamentos(origem, origem_id)
  where origem <> 'manual' and origem_id is not null;
