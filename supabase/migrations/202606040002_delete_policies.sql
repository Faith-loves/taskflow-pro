do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'Admins can delete projects') then
    create policy "Admins can delete projects" on public.projects for delete using (public.has_workspace_role(workspace_id, array['Owner','Admin']::public.workspace_role[]));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks' and policyname = 'Members can delete tasks') then
    create policy "Members can delete tasks" on public.tasks for delete using (
      exists (select 1 from public.projects p where p.id = project_id and public.has_workspace_role(p.workspace_id, array['Owner','Admin','Member']::public.workspace_role[]))
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'task_attachments' and policyname = 'Members can delete attachments') then
    create policy "Members can delete attachments" on public.task_attachments for delete using (
      uploaded_by = auth.uid() or exists (select 1 from public.tasks t join public.projects p on p.id = t.project_id where t.id = task_id and public.has_workspace_role(p.workspace_id, array['Owner','Admin']::public.workspace_role[]))
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'Users can delete own notifications') then
    create policy "Users can delete own notifications" on public.notifications for delete using (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can delete task attachments') then
    create policy "Authenticated users can delete task attachments"
    on storage.objects for delete to authenticated
    using (bucket_id = 'task-attachments');
  end if;
end $$;
