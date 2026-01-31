# Data Analysis Reference

## Python Workflow

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# 1. Load
df = pd.read_csv("data.csv")

# 2. Explore
print(df.info())
print(df.describe())
print(df.isnull().sum())

# 3. Clean
df = df.dropna(subset=["required_column"])
df["date"] = pd.to_datetime(df["date"])

# 4. Analyze
summary = df.groupby("category").agg({
    "value": ["mean", "sum", "count"]
})

# 5. Visualize
plt.figure(figsize=(10, 6))
sns.barplot(data=df, x="category", y="value")
plt.title("Values by Category")
plt.savefig("output.png", dpi=300, bbox_inches="tight")
```

## Statistical Tests

| Question | Test | Python |
|----------|------|--------|
| Compare 2 groups | t-test | `scipy.stats.ttest_ind()` |
| Compare 3+ groups | ANOVA | `scipy.stats.f_oneway()` |
| Correlation | Pearson | `df.corr()` |
| Categorical relation | Chi-square | `scipy.stats.chi2_contingency()` |

## Visualization Selection

| Data Type | Chart |
|-----------|-------|
| Trend over time | Line chart |
| Compare categories | Bar chart |
| Distribution | Histogram, box plot |
| Relationship | Scatter plot |
| Composition | Pie chart, stacked bar |

## Best Practices

- Never modify source data files
- Document all transformations
- Handle missing values explicitly
- Validate data quality before analysis
- Use colorblind-friendly palettes
- Include sample sizes and confidence intervals
- Save visualizations at 300 DPI

## Libraries

```bash
pip install pandas numpy matplotlib seaborn scipy scikit-learn
```
