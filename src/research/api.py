from fastapi import FastAPI

app = FastAPI(title='Jupiter × Meteora Research', version='0.1.0')


@app.get('/health')
def health():
    return {'status': 'ok', 'stage': 'pool-ingestion', 'pnl_available': False}
