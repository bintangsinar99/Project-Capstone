
import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt

st.set_page_config(page_title='MindTrack Dashboard', layout='wide')

st.title('MindTrack: Dashboard Insight Tingkat Stres Mahasiswa')
st.write('Dashboard ini menampilkan insight dari data kesehatan mental dan pola aktivitas digital mahasiswa.')

df = pd.read_csv('final_clean_dataset.csv')

st.subheader('Preview Dataset')
st.dataframe(df.head())

st.subheader('Distribusi Stress Level')
stress_count = df['stress_level'].value_counts().sort_index()
fig, ax = plt.subplots(figsize=(7, 5))
ax.bar(stress_count.index.astype(str), stress_count.values)
ax.set_xlabel('Stress Level')
ax.set_ylabel('Jumlah Data')
ax.set_title('Distribusi Stress Level')
st.pyplot(fig)

st.subheader('Daily Screen Time berdasarkan Stress Level')
fig, ax = plt.subplots(figsize=(7, 5))
df.boxplot(column='Daily_Screen_Time_Hours', by='stress_level', ax=ax)
plt.suptitle('')
ax.set_title('Daily Screen Time berdasarkan Stress Level')
st.pyplot(fig)

st.subheader('Social Media Usage berdasarkan Stress Level')
fig, ax = plt.subplots(figsize=(7, 5))
df.boxplot(column='Social_Media_Usage_Hours', by='stress_level', ax=ax)
plt.suptitle('')
ax.set_title('Social Media Usage berdasarkan Stress Level')
st.pyplot(fig)

st.subheader('Korelasi terhadap Stress Level')
corr = df.corr(numeric_only=True)['stress_level'].sort_values(ascending=False)
st.dataframe(corr)

st.subheader('Kesimpulan')
st.write('Fitur mental, akademik, sosial, dan aktivitas digital dapat digunakan sebagai kandidat fitur untuk tahap modeling oleh AI Engineer.')
