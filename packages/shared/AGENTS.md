# Shared schema instructions

親ディレクトリの `AGENTS.md` に加え、`packages/shared/**` を変更する前に `../../.claude/rules/coding-standards.md` と `../../.claude/rules/error-handling.md` を読んで守ってください。

このパッケージの Zod スキーマは front（TanStack Form）と api（`@hono/zod-validator`）で共有されます。スキーマを変更する場合は、両利用側と API 契約への影響を確認し、必要に応じて `docs/07-api-specification.md` を同じ変更セットで更新します。
