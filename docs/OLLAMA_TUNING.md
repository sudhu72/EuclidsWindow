# Ollama Tuning Steps (Local Math Tutor)

This guide documents the steps used to tune the local Ollama model for the
Euclid's Window generative tutor.

## 1. Install Ollama

```bash
brew install ollama
```

## 2. Pull the Base Model

Recommended:

```bash
ollama run qwen2.5-math:7b
```

## 3. Create a Modelfile (Tuned Defaults)

Create a file named `Modelfile` in a local folder:

```
FROM qwen2.5-math:7b

# Tuning for structured JSON + math reasoning
PARAMETER temperature 0.2
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1
PARAMETER num_ctx 8192

SYSTEM You are a math tutor. Always return strict JSON only. Avoid extra text.
```

## 4. Build the Tuned Model

```bash
ollama create euclid-math -f Modelfile
```

## 5. Verify the Model

```bash
ollama run euclid-math
```

Test prompt:

```
Explain the chain rule and decide if a visualization helps.
```

You should see strict JSON output per the app's required format.

## 6. Point the App to the Tuned Model

Set the environment variable before starting the backend:

```bash
export LOCAL_LLM_MODEL=euclid-math
```

## 7. Optional: Tighten JSON Compliance

If the model sometimes returns non-JSON text, reduce temperature further:

```
PARAMETER temperature 0.1
```

Rebuild:

```bash
ollama create euclid-math -f Modelfile
```

---

Notes:
- `num_ctx` should fit your Mac's memory. Reduce it if you see slowdowns.
- You can keep multiple tuned models (e.g., `euclid-math-fast`, `euclid-math-precise`).
