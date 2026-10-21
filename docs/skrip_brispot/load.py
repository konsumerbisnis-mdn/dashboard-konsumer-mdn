import pandas as pd, openpyxl, re, sys
F=sys.argv[1] if len(sys.argv)>1 else '/root/.claude/uploads/ef486858-acdd-5367-bd02-947c675ab03e/f7c41278-1792568951894_Brispot_Briguna_-_21_Okt_26_14.16_Temp.xlsx'
norm=lambda s: re.sub(r'\s+',' ',str(s)).strip().upper()
def rp(x):
    s=str(x).replace('Rp','').replace(' ','').replace('.','').replace(',-','')
    try: return float(s)
    except: return 0.0
def load():
    nom=pd.read_excel(F,sheet_name='Nominatif',usecols='A:AT',dtype=str)
    nom=nom[nom['REFNO'].notna()&(nom['REFNO'].str.strip()!='')].copy()
    rule=pd.read_excel(F,sheet_name='Rule',dtype=str)
    rmap={norm(a):(b,c) for a,b,c in rule.values}
    nom['STATUS']=nom['STATUS KREDIT'].map(lambda s: rmap.get(norm(s),('LAINNYA','-'))[0])
    nom['REMARKS']=nom['STATUS KREDIT'].map(lambda s: rmap.get(norm(s),('LAINNYA','-'))[1])
    for c in ['PLAFON','OS PINJAMAN EKSISTING','NET OS']: nom[c+'_N']=nom[c].map(rp)
    nom['TGL_AJU']=pd.to_datetime(nom['TANGGAL PENGAJUAN'],errors='coerce')
    tc=pd.to_numeric(nom['TANGGAL SUKSES PEMBUKUAN'],errors='coerce')
    d1=pd.to_datetime('1899-12-30')+pd.to_timedelta(tc,unit='D')
    d2=pd.to_datetime(nom['TANGGAL SUKSES PEMBUKUAN'].where(tc.isna()),errors='coerce')
    tp=pd.to_numeric(nom['TANGGAL PENCAIRAN'],errors='coerce')
    d3=pd.to_datetime('1899-12-30')+pd.to_timedelta(tp,unit='D')
    nom['TGL_CAIR']=d3.fillna(d1).fillna(d2).dt.normalize()
    nom['KEY_NAMA']=nom['NAMA PEMRAKARSA'].map(norm)
    # dedupe per NIK: status paling maju, lalu pengajuan terbaru
    pri={'PENCAIRAN SUKSES':3,'HOT LEADS':2,'WARM LEADS':1,'-':0}
    nom['PRI']=nom['REMARKS'].map(pri).fillna(0)
    nom['NIKK']=nom['NIK'].fillna(nom['REFNO']).str.replace("'","").str.strip()
    nom=nom.sort_values(['NIKK','PRI','TGL_AJU'],ascending=[True,False,False])
    nom['DOUBLE']=nom.duplicated('NIKK').astype(int)
    wb=openpyxl.load_workbook(F,data_only=True)
    L=wb['LIST']
    rm=[(L.cell(r,3).value,L.cell(r,4).value) for r in range(2,L.max_row+1) if L.cell(r,4).value]
    mt=[(L.cell(r,8).value,L.cell(r,9).value,L.cell(r,10).value) for r in range(2,L.max_row+1) if L.cell(r,10).value]
    rm=pd.DataFrame(rm,columns=['KANCA','NAMA']); mt=pd.DataFrame(mt,columns=['KANCA','UNIT','NAMA'])
    def ren(ws,cn,cd,co,cdate):
        out={};tgl=None
        for r in range(7,ws.max_row+1):
            n=ws.cell(r,cn).value
            if ws.cell(r,cdate).value and tgl is None: tgl=ws.cell(r,cdate).value
            if not n or norm(n) in ('TOTAL','GRAND TOTAL'): continue
            num=lambda v: float(v) if isinstance(v,(int,float)) else 0.0
            out[norm(n)]=(num(ws.cell(r,cd).value),num(ws.cell(r,co).value))
        return out,tgl
    ren_rm,t1=ren(wb['RM BGRITEL'],27,34,35,36)
    ren_mt,t2=ren(wb['Mantri BGMIKRO'],30,37,38,39)
    return nom,rm,mt,ren_rm,ren_mt,(t1 or t2)
