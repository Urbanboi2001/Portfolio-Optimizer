import pandas as pd
import numpy as np

cov = pd.DataFrame([[1, 2], [2, 1]])
weights = np.array([0.5, 0.5])

print(type(np.dot(cov, weights)))
print(np.dot(cov, weights))
