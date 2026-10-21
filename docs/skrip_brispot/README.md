# Skrip olah Brispot Warm/Hot Leads (ketentuan 18)

    python3 fill.py "<file Brispot Briguna - dd Mmm yy HH.MM Temp.xlsx>" out_raw.xlsx

Lalu hitung ulang rumus (buka di Excel, atau LibreOffice headless) dan simpan sebagai nilai.
Butuh: pandas, openpyxl. `load.py` = baca Nominatif/Rule/LIST/Rencana Real + dedup NIK;
`fill.py` = isi 4 sheet template (RM BGRITEL, KC BGRITEL, Mantri BGMIKRO, Unit BGMIKRO).
