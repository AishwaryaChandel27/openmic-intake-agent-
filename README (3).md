# 🚀 Project Deployment with Nix, Node.js, PostgreSQL, and OpenAI Integration

This project is configured to run in a **Nix-based environment** with support for Node.js, PostgreSQL, and web server deployment. It includes automation for development and production builds, port mapping, and workflow tasks to simplify execution.

---

## 📂 Project Structure & Configuration

### **Modules**
The project uses the following modules:
- `nodejs-20` → Runtime environment for Node.js applications.
- `web` → Web server integration.
- `postgresql-16` → Database for persistent data storage.

### **Run Command**
Development server:
```bash
npm run dev
```

---

## ⚙️ Nix Configuration
The environment is pinned to the stable channel:
```toml
[nix]
channel = "stable-24_05"
```

---

## 🚀 Deployment

### **Deployment Target**
- **Autoscale** → Automatically scales application in production.

### **Build & Run**
```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
```

- `npm run build` → Prepares the app for production.
- `npm run start` → Starts the production server.

---

## 🔌 Ports Mapping
```toml
[[ports]]
localPort = 5000
externalPort = 80
```

- **Local Development:** Runs on port `5000`.
- **Production/Deployment:** Exposed on port `80`.

---

## 🌍 Environment Variables
```toml
[env]
PORT = "5000"
```

- `PORT` → Default port for the server.

---

## 🤖 Agent Integrations
```toml
[agent]
integrations = ["javascript_openai:1.0.0"]
```

- Integration with **OpenAI JavaScript SDK** for AI-powered features.

---

## 🔄 Workflows

### **Run Button**
Runs the `"Project"` workflow by default:
```toml
[workflows]
runButton = "Project"
```

---

### **Workflows Defined**

#### Workflow 1: **Project**
- Runs in **parallel** mode.
- Author: `agent`.

```toml
[[workflows.workflow]]
name = "Project"
mode = "parallel"
author = "agent"

[[workflows.workflow.tasks]]
task = "workflow.run"
args = "Start application"
```

---

#### Workflow 2: **Start Application**
- Starts the app with development server.

```toml
[[workflows.workflow]]
name = "Start application"
author = "agent"

[[workflows.workflow.tasks]]
task = "shell.exec"
args = "npm run dev"
waitForPort = 5000
```

---

## 🛠️ Development Guide

### **1. Clone the Repository**
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Run in Development Mode**
```bash
npm run dev
```
- App will start at: [http://localhost:5000](http://localhost:5000)

### **4. Build for Production**
```bash
npm run build
```

### **5. Run Production Server**
```bash
npm run start
```
- Exposed on port `80` in deployment.

---

## 📦 Hidden Files & Directories
The following files/folders are ignored:
```
.config
.git
generated-icon.png
node_modules
dist
```

---

## 🧑‍💻 Author
- **Agent** (with OpenAI integration)

---

## 📜 License
This project is licensed under the **MIT License** – feel free to modify and use.
