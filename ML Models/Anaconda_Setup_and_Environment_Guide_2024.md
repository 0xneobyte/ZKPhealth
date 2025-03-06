# Anaconda Setup & Environment Guide (2024)

1. **Install Anaconda:**
   - Download from the official website: [Anaconda Download](https://www.anaconda.com/products/distribution).
   - Run the installer and follow the steps.

2. **Create a Conda Environment:**
   - Open **Anaconda Prompt** and run:
     ```bash
     conda create --name myenv python=3.10
     ```
   - This creates an environment named “myenv” with Python 3.10 (you can choose another name).

3. **Activate the Environment:**
   - Use this command:
     ```bash
     conda activate myenv
     ```
   - You’ll see “(myenv)” in the prompt when activated.

4. **Install Libraries:**
   - Run these one by one to install essential libraries:
     ```bash
      pip install tensorflow==2.10.1
      pip install scikit-learn
      pip install pandas
      pip install transformers
      pip install xgboost
      pip install lightgbm
      pip install matplotlib nltk opencv-python wordcloud seaborn openpyxl

     ```
   - This setup covers libraries for data science, ML, NLP, and data visualization.

**Tip:** Activate the environment each time with `conda activate myenv` to use these libraries.

---

This setup is ready for all kinds of data and machine learning projects!
