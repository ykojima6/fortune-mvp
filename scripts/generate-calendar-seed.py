from datetime import date, timedelta
from pathlib import Path

try:
    from lunardate import LunarDate
except ImportError as exc:
    raise SystemExit(
        "Missing dependency: lunardate. Install it with `python3 -m pip install --user lunardate==0.2.2`."
    ) from exc


START = date(1900, 1, 31)
END = date(2099, 12, 31)
OUTPUT = Path("supabase/calendar_seed.sql")

ROKUYO = ["大安", "赤口", "先勝", "友引", "先負", "仏滅"]
STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]
PHASES = [
    (1, "新月"),
    (3, "三日月"),
    (7, "上弦"),
    (12, "十三夜"),
    (15, "満月"),
    (16, "十六夜"),
    (22, "下弦"),
    (26, "有明月"),
]


def moon_phase(lunar_day: int) -> str:
    phase = PHASES[0][1]
    for day, name in PHASES:
        if lunar_day >= day:
            phase = name
        else:
            break
    return phase


def sexagenary_day(current: date) -> str:
    # 1900-01-31 is used only as a stable epoch for the daily cycle label.
    diff = (current - START).days
    return f"{STEMS[(diff + 6) % 10]}{BRANCHES[diff % 12]}"


def sql_bool(value: bool) -> str:
    return "true" if value else "false"


def build_rows() -> list[str]:
    rows: list[str] = []
    current = START
    while current <= END:
        lunar = LunarDate.fromSolarDate(current.year, current.month, current.day)
        rows.append(
            "("
            f"'{current.isoformat()}',"
            f"{lunar.year},"
            f"{lunar.month},"
            f"{lunar.day},"
            f"{sql_bool(lunar.isLeapMonth)},"
            f"'{moon_phase(lunar.day)}',"
            f"'{ROKUYO[(lunar.month + lunar.day) % 6]}',"
            f"'{sexagenary_day(current)}'"
            ")"
        )
        current += timedelta(days=1)
    return rows


def main() -> None:
    rows = build_rows()
    chunks: list[str] = [
        "alter table public.calendar_days "
        "add column if not exists is_leap_month boolean not null default false;",
        "delete from public.calendar_days "
        f"where solar_date < '{START.isoformat()}' or solar_date > '{END.isoformat()}';",
    ]

    for i in range(0, len(rows), 500):
        chunks.append(
            """insert into public.calendar_days
  (solar_date,lunar_year,lunar_month,lunar_day,is_leap_month,moon_phase,rokuyo,sexagenary)
values
  {values}
on conflict (solar_date) do update set
  lunar_year = excluded.lunar_year,
  lunar_month = excluded.lunar_month,
  lunar_day = excluded.lunar_day,
  is_leap_month = excluded.is_leap_month,
  moon_phase = excluded.moon_phase,
  rokuyo = excluded.rokuyo,
  sexagenary = excluded.sexagenary;""".format(values=",\n  ".join(rows[i : i + 500]))
        )

    OUTPUT.write_text("\n\n".join(chunks) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT} with {len(rows)} rows.")


if __name__ == "__main__":
    main()
