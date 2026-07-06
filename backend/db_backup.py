"""MySQL 資料庫備份匯出/匯入工具

用法(於 backend 容器內執行):
    python db_backup.py export          將目前資料庫匯出成 backups/<日期時間>.sql，
                                         並將 media/ 資料夾打包成 backups/<日期時間>_media.tar.gz
    python db_backup.py import [檔案]     匯入指定的 .sql 檔，不指定則匯入 backups/ 下最新的備份；
                                         若同目錄下有對應的 <檔名>_media.tar.gz，會一併還原 media/
"""

import argparse
import os
import shutil
import subprocess
import sys
import tarfile
from datetime import datetime
from pathlib import Path

from decouple import config

BACKUP_DIR = Path(__file__).resolve().parent / "backups"
MEDIA_ROOT = Path(__file__).resolve().parent / "media"

DB_NAME = config("DB_NAME", default="aiumstore")
DB_USER = config("DB_USER", default="aiumstore")
DB_PASSWORD = config("DB_PASSWORD", default="aiumstore")
DB_HOST = config("DB_HOST", default="db")
DB_PORT = config("DB_PORT", default="3306")


def _mysql_env():
    return {**os.environ, "MYSQL_PWD": DB_PASSWORD}


def _media_archive_for(sql_path: Path) -> Path:
    return sql_path.with_name(sql_path.stem + "_media.tar.gz")


def export_database():
    BACKUP_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = BACKUP_DIR / f"{timestamp}.sql"
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

    if MEDIA_ROOT.exists() and any(MEDIA_ROOT.iterdir()):
        media_archive = _media_archive_for(filename)
        with tarfile.open(media_archive, "w:gz") as tar:
            tar.add(MEDIA_ROOT, arcname=".")
        print(f"已匯出：{media_archive}")

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

    media_archive = _media_archive_for(path)
    if media_archive.exists():
        if MEDIA_ROOT.exists():
            shutil.rmtree(MEDIA_ROOT)
        MEDIA_ROOT.mkdir(parents=True)
        with tarfile.open(media_archive, "r:gz") as tar:
            tar.extractall(MEDIA_ROOT, filter="data")
        print(f"已匯入：{media_archive}")
    else:
        print("找不到對應的 media 備份，僅還原資料庫", file=sys.stderr)


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
