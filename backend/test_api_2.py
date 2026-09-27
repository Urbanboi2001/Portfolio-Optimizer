import pandas as pd
import numpy as np
import io
import urllib.request
import urllib.parse
import json

def encode_multipart_formdata(fields, files):
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = []
    for (key, filename, value) in files:
        body.append('--' + boundary)
        body.append(f'Content-Disposition: form-data; name="{key}"; filename="{filename}"')
        body.append('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        body.append('')
        body.append(value)
    body.append('--' + boundary + '--')
    body.append('')
    body_bytes = bytearray()
    for item in body:
        if isinstance(item, str):
            body_bytes.extend(item.encode('utf-8'))
            body_bytes.extend(b'\r\n')
        else:
            body_bytes.extend(item)
            body_bytes.extend(b'\r\n')
    return body_bytes, 'multipart/form-data; boundary=' + boundary

df1 = pd.DataFrame({
    'Date': pd.date_range('2021-01-01', periods=10),
    'Net Asset Value': np.random.rand(10) * 100
})
df_full = pd.DataFrame(index=range(20), columns=range(5))
df_full.iloc[3, 0] = 'MyFund'
df_full.iloc[4, 0] = 'Date'
df_full.iloc[4, 1] = 'Net Asset Value'
df_full.iloc[5:15, 0] = df1['Date']
df_full.iloc[5:15, 1] = df1['Net Asset Value']

buf = io.BytesIO()
df_full.to_excel(buf, index=False, header=False)
buf.seek(0)

body, content_type = encode_multipart_formdata([], [('files', 'test.xlsx', buf.read())])

req = urllib.request.Request('http://localhost:8000/api/analyze', data=body)
req.add_header('Content-Type', content_type)

try:
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode())
        print(json.dumps(res, indent=2))
except Exception as e:
    print(e)
