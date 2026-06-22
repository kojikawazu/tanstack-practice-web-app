import { useForm } from '@tanstack/react-form';
import { TASK_PRIORITY, TASK_STATUS, type TaskFilters } from '@repo/shared';
import { Button, FieldError, Label, Select, TextInput } from '@/components/ui';
import { fieldErrorMessages } from '@/lib/form';
import { useCreateTask } from './api';
import { dateInputToIso, PRIORITY_LABEL, STATUS_LABEL } from './format';
import { taskFormSchema, type TaskFormValues } from './task-form-schema';

export function TaskCreateForm({
  filters,
  onCreated,
}: {
  filters: TaskFilters;
  onCreated?: () => void;
}) {
  const create = useCreateTask(filters);
  const defaultValues: TaskFormValues = {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
  };
  const form = useForm({
    defaultValues,
    validators: { onChange: taskFormSchema },
    onSubmit: async ({ value, formApi }) => {
      await create.mutateAsync({
        title: value.title,
        description: value.description,
        status: value.status,
        priority: value.priority,
        dueDate: dateInputToIso(value.dueDate),
      });
      formApi.reset();
      onCreated?.();
    },
  });

  return (
    <form
      className="grid grid-cols-1 gap-3 rounded-md border border-gray-200 bg-white p-4 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="title">
        {(field) => (
          <div className="md:col-span-2">
            <Label>タイトル</Label>
            <TextInput
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError messages={fieldErrorMessages(field.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <form.Field name="status">
        {(field) => (
          <div>
            <Label>ステータス</Label>
            <Select
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value as (typeof TASK_STATUS)[number])}
            >
              {TASK_STATUS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
        )}
      </form.Field>

      <form.Field name="priority">
        {(field) => (
          <div>
            <Label>優先度</Label>
            <Select
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value as (typeof TASK_PRIORITY)[number])}
            >
              {TASK_PRIORITY.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </Select>
          </div>
        )}
      </form.Field>

      <form.Field name="dueDate">
        {(field) => (
          <div>
            <Label>期限</Label>
            <TextInput
              type="date"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <div className="md:col-span-2">
            <Label>説明</Label>
            <TextInput
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError messages={fieldErrorMessages(field.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <div className="md:col-span-2">
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? '作成中…' : 'タスクを作成'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
