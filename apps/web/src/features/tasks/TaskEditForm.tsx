import { useForm } from '@tanstack/react-form';
import { TASK_PRIORITY, TASK_STATUS, type TaskDto } from '@repo/shared';
import { Button, FieldError, Label, Select, TextInput } from '@/components/ui';
import { fieldErrorMessages } from '@/lib/form';
import { useUpdateTask } from './api';
import { dateInputToIso, PRIORITY_LABEL, STATUS_LABEL, toDateInputValue } from './format';
import { taskFormSchema } from './task-form-schema';

/**
 * タスク編集フォーム。作成フォームとの違いは2点。
 *
 * 1. defaultValues に既存タスクの値を詰める（作成は空）。
 *    API の ISO 文字列を toDateInputValue で 'YYYY-MM-DD' に直してから渡し、
 *    送信時に dateInputToIso で戻す。<input type="date"> の形式に合わせるため。
 * 2. useUpdateTask に filters を渡していない。この画面は一覧を表示していないので
 *    一覧キャッシュの楽観的更新は行わず、詳細キャッシュの更新と
 *    onSettled の invalidate に任せる。
 */
export function TaskEditForm({ task, onSaved }: { task: TaskDto; onSaved?: () => void }) {
  const update = useUpdateTask();
  const form = useForm({
    defaultValues: {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: toDateInputValue(task.dueDate),
    },
    // 作成と同じスキーマを共有する。入力仕様が1箇所に集まるため、
    // 作成だけ通って編集で弾かれるといった食い違いが起きない。
    validators: { onChange: taskFormSchema },
    onSubmit: async ({ value }) => {
      await update.mutateAsync({
        id: task.id,
        input: {
          title: value.title,
          description: value.description,
          status: value.status,
          priority: value.priority,
          dueDate: dateInputToIso(value.dueDate),
        },
      });
      onSaved?.();
    },
  });

  return (
    <form
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
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
              {isSubmitting ? '保存中…' : '保存'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
