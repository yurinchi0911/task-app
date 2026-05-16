-- =========================================
-- 全ユーザーとアプリデータの完全削除（復元不可）
-- Supabase Dashboard → SQL Editor で貼り付けて実行
-- =========================================
--
-- 前提: このリポジトリの schema.sql + add_features.sql + add_stripe_columns.sql のテーブルのみ。
-- Storage バケットにファイルがある場合は、Dashboard → Storage から別途削除してください。
--
-- 実行権限: SQL Editor は通常 postgres 権限のため auth.users の削除も可能です。
-- 失敗する場合は Dashboard → Authentication → Users から個別削除を試してください。
-- =========================================

BEGIN;

-- プロジェクトにぶら下がるテーブルを CASCADE でまとめて空にする
TRUNCATE TABLE public.projects CASCADE;

-- ユーザー紐付けのみのテーブル
TRUNCATE TABLE public.feedbacks CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- 認証ユーザー（identities / sessions 等はスキーマ設定に応じて連動削除）
DELETE FROM auth.users;

COMMIT;
