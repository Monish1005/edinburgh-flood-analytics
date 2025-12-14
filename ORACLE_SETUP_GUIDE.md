# Oracle Database Setup Guide (Mac Friendly) 🍎

You need a running Oracle Database to use the admin scripts I created.
Since you are on a Mac, you have two main options. **Option A is recommended** if you don't want to install heavy software.

---

## ☁️ Option A: Oracle Cloud Free Tier (Easiest)
Oracle gives you a free database in the cloud forever ("Always Free").

1.  **Sign Up**: Go to [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2.  **Create DB**:
    *   Log in to OCI Console.
    *   Search for **"Autonomous Database"**.
    *   Click **"Create Autonomous Database"**.
    *   Name it `FloodDB`.
    *   Select **"Transaction Processing"** and **"Always Free"**.
    *   Set a Password (e.g., `StrongPass123!`).
    *   Click **Create**.
3.  **Connect**:
    *   Once green (Available), click **"Database Connection"**.
    *   Download the **"Instance Wallet"** zip file.
    *   *We will use this Wallet to connect your Python app securely.*

---

## 🐳 Option B: Local Docker (For Pros)
If you prefer running everything on your laptop, you need Docker.
*(Note: Mac M1/M2 chips need "Colima" to run Oracle properly).*

### 1. Install Docker & Colima
Open Terminal and run:
```bash
brew install colima docker
colima start --arch x86_64 --memory 4
```

### 2. Start Oracle Container
Run this command to download and start Oracle Express Edition (XE):
```bash
docker run -d \
  --name oracle-xe \
  -p 1521:1521 \
  -e ORACLE_PWD=StrongPass123! \
  container-registry.oracle.com/database/express:latest
```

### 3. Verify
Check if it's running:
```bash
docker ps
```
Your connection string is: `localhost:1521/XE`

---

## 🚀 Step 2: Running the Admin Script
Once you have a database (Cloud or Local):

1.  **Install Tool**: Download **SQL Developer** (GUI) or install `sqlcl` (Command Line).
2.  **Connect**: Use the credentials you just created.
3.  **Run Script**: Open `oracle_setup.sql` (which I created for you) and hit "Run Script".
    *   It will create the `EDINBURGH_BUILDINGS` tables and Indexes.
4.  **Load Data**:
    *   Run `python export_to_oracle.py`.
    *   Use SQL Loader (or SQL Developer Import Wizard) to upload the resulting CSVs.
