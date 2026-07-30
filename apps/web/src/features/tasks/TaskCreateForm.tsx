import { useForm } from '@tanstack/react-form';
import { TASK_PRIORITY, TASK_STATUS, type TaskFilters } from '@repo/shared';
import { Button, FieldError, Label, Select, TextInput } from '@/components/ui';
import { fieldErrorMessages } from '@/lib/form';
import { useCreateTask } from './api';
import { dateInputToIso, PRIORITY_LABEL, STATUS_LABEL } from './format';
import { taskFormSchema, type TaskFormValues } from './task-form-schema';

/**
 * タスク作成フォーム。TanStack Form の基本形。
 *
 * TanStack Form も headless で、入力要素は自前で描画する。
 * 特徴は「フィールド単位で購読する」こと。form.Field / form.Subscribe が
 * 必要な部分だけを購読するため、1文字入力するたびにフォーム全体が
 * 再描画されるということが起きない。
 *
 * filters を受け取るのは、作成成功後に「今表示している一覧」のキャッシュを
 * 正しく invalidate するため（api.ts の useCreateTask を参照）。
 */
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
    // validators に Zod スキーマを直接渡せるのは Standard Schema 対応のおかげ。
    // onChange なので入力のたびに検証が走る（onBlur / onSubmit も指定可能）。
    // これは UX 用の検証で、信頼できる検証はサーバー側が行う。
    validators: { onChange: taskFormSchema },
    // onSubmit は検証を通過したときだけ呼ばれる。
    // 送信処理そのものは Query の mutation に委ね、フォームは値の管理に専念する。
    onSubmit: async ({ value, formApi }) => {
      await create.mutateAsync({
        title: value.title,
        description: value.description,
        status: value.status,
        priority: value.priority,
        // フォームは <input type="date"> の 'YYYY-MM-DD' を持っているので、
        // API 契約（ISO 8601）へ変換してから送る。
        dueDate: dateInputToIso(value.dueDate),
      });
      formApi.reset();
      onCreated?.();
    },
  });

  return (
    <form
      className="grid grid-cols-1 gap-3 rounded-md border border-gray-200 bg-white p-4 md:grid-cols-2"
      // ブラウザ既定の送信（ページ全体のリロード）を止めてから
      // TanStack Form の handleSubmit へ渡す。この2行は定型。
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {/*
        form.Field は render props で 1フィールドの状態を配る。
        - field.state.value … 現在値
        - field.handleChange … 値の更新（React の onChange と繋ぐ）
        - field.handleBlur … touched の記録（未入力エラーの出し分けに使う）
        - field.state.meta.errors … このフィールドの検証エラー
        name は defaultValues のキーと型で結び付いており、綴りを間違えると型エラーになる。
      */}
      <form.Field name="title">
        {(field) => (
          <div className="md:col-span-2">
            <Label>タイトル</Label>
            <TextInput
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {/* errors の要素は文字列とオブジェクトの両方がありうるため lib/form.ts で正規化 */}
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
        {/*
          form.Subscribe はフォーム全体の状態のうち selector で選んだ部分だけを購読する。
          これを使わず form.state を直接読むと、どの入力欄を触っても
          このボタンが再描画される。再描画範囲を絞るための仕組み。
        */}
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
