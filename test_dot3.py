import pandas as pd
import numpy as np

cov = pd.DataFrame([[1.0, 2.0], [2.0, 1.0]])
weights = np.array([0.5, 0.5])

v1 = np.dot(cov, weights)
print(type(v1), v1)

v2 = np.dot(weights.T, v1)
print(type(v2), v2)
print(np.sqrt(v2))
