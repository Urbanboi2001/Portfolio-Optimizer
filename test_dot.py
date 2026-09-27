import pandas as pd
import numpy as np

df = pd.DataFrame({"A": [0.01, 0.02], "B": [0.03, -0.01]})
weights = np.array([0.5, 0.5])

res = df.dot(weights)
print("DF DOT WEIGHTS:")
print(res)
