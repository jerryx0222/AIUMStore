"""MySQL 資料庫備份匯出/匯入工具

用法(於 backend 容器內執行):
    python db_backup.py export          將目前資料庫匯出成 backups/<日期時間>.sql
    python db_backup.py import [檔案]     匯入指定的 .sql 檔，不指定則匯入 backups/ 下最新的備份
"""

import argparse
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

from decouple import config

BACKUP_DIR = Path(__file__).resolve().parent / "backups"

DB_NAME = config("DB_NAME", default="aiumstore")
DB_USER = config("DB_USER", default="aiumstore")
DB_PASSWORD = config("DB_PASSWORD", default="aiumstore")
DB_HOST = config("DB_HOST", default="db")
DB_PORT = config("DB_PORT", default="3306")


def _mysql_env():
    return {**os.environ, "MYSQL_PWD": DB_PASSWORD}


def export_database():
    BACKUP_DIR.mkdir(exist_ok=True)
    filename = BACKUP_DIR / f"{datetime.now():%Y%m%d_%H%M%S}.sql"
    command = [
        "mysqldump",
        f"-h{DB_HOST}",
        f"-P{DB_PORT}",
        f"-u{DB_USER}",
        "--routines",
        "--triggers",
        "--single-transaction",
        "--no-tablespaces",
        DB_NAME,
    ]
    with open(filename, "wb") as f:
        subprocess.run(command, stdout=f, env=_mysql_env(), check=True)
    print(f"已匯出：{filename}")
    return filename


def import_database(sql_file: str | None):
    if sql_file:
        path = Path(sql_file)
    else:
        candidates = sorted(BACKUP_DIR.glob("*.sql"))
        if not candidates:
            print("找不到可匯入的備份檔，請先執行 export 或指定檔案路徑", file=sys.stderr)
            sys.exit(1)
        path = candidates[-1]

    if not path.exists():
        print(f"找不到檔案：{path}", file=sys.stderr)
        sys.exit(1)

    command = [
        "mysql",
        f"-h{DB_HOST}",
        f"-P{DB_PORT}",
        f"-u{DB_USER}",
        DB_NAME,
    ]
    with open(path, "rb") as f:
        subprocess.run(command, stdin=f, env=_mysql_env(), check=True)
    print(f"已匯入：{path}")


def main():
    parser = argparse.ArgumentParser(description="MySQL 資料庫備份匯出/匯入工具")
    subparsers = parser.add_subparsers(dest="action", required=True)
    subparsers.add_parser("export", help="將目前資料庫匯出成日期時間.sql")
    import_parser = subparsers.add_parser("import", help="匯入指定的.sql檔(預設為最新備份)")
    import_parser.add_argument("file", nargs="?", default=None, help="要匯入的 .sql 檔路徑")

    args = parser.parse_args()
    if args.action == "export":
        export_database()
    elif args.action == "import":
        import_database(args.file)


if __name__ == "__main__":
    main()
