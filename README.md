# pumping-lemma-tool

An interactive web-based tool to understand and experiment with the **Pumping Lemma** for both **Regular Languages (RL)** and **Context-Free Languages (CFL)**.

---

## 🚀 Features

### 🔹 Regular Language Mode

Supports multiple predefined languages:

- `a^n b^n` (non-regular)
- `a* b*` (regular)
- Palindromes `ww^R`
- Equal number of `a`'s and `b`'s
- Prime-length strings
- Perfect square-length strings

Additional features:

- Interactive decomposition into `x, y, z`
- Real-time pumping simulation: `xy^i z`
- Automatic contradiction detection

---

### 🔸 Context-Free Language Mode (Advanced)

Supports:

- `a^n b^n c^n`
- `ww`

Features:

- Decomposition into `u, v, w, x, y`
- CFL pumping simulation: `uv^i w x^i y`

---

### 🎛 Interactive Controls

- Adjustable pumping length `p`
- Sliders for decomposition parts
- Step-by-step increment of pumping value `i`
- Random example generator
- Reset functionality

---

### 📊 Visual Enhancements

- Color-coded segments (`x, y, z` / `u, v, w, x, y`)
- Animated pumping visualization
- Character counter panel
- Contradiction highlighting
- Hint system

---

## 🖥️ Tech Stack

- HTML5
- CSS3 (Dark Theme UI)
- Vanilla JavaScript

---

## 📂 Project Structure
pumping-lemma-tool/
│── index.html
│── style.css
│── app.js
│── README.md

## ⚙️ How to Run

1. Clone the repository:

git clone https://github.com/your-username/pumping-lemma-visualizer.git


2. Open the folder:

cd pumping-lemma-visualizer


3. Run the project:
- Open `index.html` in your browser

---

## 🧠 How It Works

### Regular Pumping Lemma

A language is regular if:

- `|y| ≥ 1`
- `|xy| ≤ p`
- `xy^i z ∈ L` for all `i ≥ 0`

---

### Context-Free Pumping Lemma

A language is context-free if:

- `|vx| ≥ 1`
- `|vwx| ≤ p`
- `uv^i w x^i y ∈ L`

---
Submitted by: Ananya<br>
Roll No: 2024UCS1572


