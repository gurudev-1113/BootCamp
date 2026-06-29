import pandas as pd
import matplotlib.pyplot as plt
import seaborn as ssn
import os

print("Understanding the Dataset....!\n")

file_name = "sales.csv"

if not os.path.exists(file_name):
    print("File not found....!")
    exit()
    
data = pd.read_csv(file_name)
print("Data Loaded Successfully....!")

df=pd.read_csv(file_name)
print("\nData stored successfully in dataframe....!")
print("Shape of the dataframe : ",df.shape)
print("\nColumns in the dataframe : ",df.columns)
print("\n First Five rows",df.head())
print("\n Last Five rows",df.tail())
print("\n Info of the dataframe : ",df.info())
print("\n Describe of the dataframe : ",df.describe())
print("\n Sum of null values : ",df.isnull().sum())

# with using Median
median_age=df['Age'].median()
df['Age']=df['Age'].fillna(median_age)
print("\n Median of Age : ",median_age)
median_spending=df['Spending'].median()
df['Spending']=df['Spending'].fillna(median_spending)
print("\n Median of Spending : ",median_spending)

#using mean
#FOR AGE:


mean_age=df['Age'].mean()
df['Age']=df['Age'].fillna(mean_age)
print("Means Age",mean_age)

#Distribution Analysis

plt.figure(figsize=(4,3))
df['Spending'].hist(bins=10,color='skyblue',edgecolor='black',linewidth=0.8)
plt.title("Distribution of Spending")
plt.xlabel("Spending Amount")
plt.ylabel("Number of Customers")
plt.show()

#correlation Matrix

correlation=df.corr(numeric_only=True)
print("\n correlation matrix :",correlation)