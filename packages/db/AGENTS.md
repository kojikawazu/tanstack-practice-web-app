# Database instructions

親ディレクトリの `AGENTS.md` に加え、`packages/db/**` を変更する前に `../../.claude/rules/database.md` を読んで守ってください。

`src/schema.ts` を正とし、変更は schema → `drizzle-kit generate` → `drizzle-kit migrate` の順で行います。生成された SQL は手動編集しません。

データモデルを変更する場合は、`docs/05-data-specification.md` を同じ変更セットで更新し、`packages/shared` 経由の型の利用側（front / api）への影響を確認します。
