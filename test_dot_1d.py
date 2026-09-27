import pandas as pd
import numpy as np

cov = pd.DataFrame([[0.04]], index=['FundA'], columns=['FundA'])
weights = np.array([1.0])

v1 = np.dot(cov, weights)
print(type(v1), v1)

v2 = np.dot(weights.T, v1)
print(type(v2), v2)
print(np.sqrt(v2))
