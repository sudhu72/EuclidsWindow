#!/usr/bin/env python3
"""Tuning helper: runs the RAFT pipeline on this Mac for Settings -> Model tuning.

The pipeline spans two places: building examples and judging need the app
container (library store, saved keys), while training and export need the
Mac itself (MLX uses the Apple GPU; export writes to the host Ollama). The
app can't start host processes, so this small server does it on request:

  build    docker exec raft.py build  (questions -> teacher answers -> split)
  train    mlx_lm.lora with a per-run config (~2 epochs, two checkpoints)
  export   both checkpoints -> Ollama as euclid-tutor:<run>-ck<step>
  pick     gate both on VALID prompts, keep the better one
  gate     final gate on TEST prompts -> PROMOTE / KEEP BASE
  finish   rename the winner to euclid-tutor:<run>, remove the candidates

It never switches the app's model: the app's own /api/tuning/promote does
that, and only for a run whose test gate said PROMOTE.

Standard library only. Listens on 127.0.0.1 (Docker Desktop forwards
host.docker.internal to it, as it does for Ollama). One run at a time; state
survives restarts in models/lora/agent/state.json.

  make lora-agent            # or: python3 scripts/lora/agent.py --port 8765
"""
from __future__ import annotations

import argparse
import json
import os
import re
import signal
import subprocess
import threading
import time
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATE_DIR = ROOT / "models/lora/agent"
STATE_FILE = STATE_DIR / "state.json"
CONTAINER = os.environ.get("RAFT_CONTAINER", "euclidswindow-euclids-window-1")
CONTAINER_RUNS = "/app/backend/data/state/raft_runs"
VENV = ROOT / ".venv-lora/bin"
BASE_OLLAMA = "qwen3:4b-instruct"
STEPS = ["build", "train", "export", "pick", "gate", "finish"]

_lock = threading.Lock()
_proc: subprocess.Popen | None = None
_cancel = threading.Event()
state: dict = {"run": None, "history": []}


# ----------------------------------------------------------------------------
def save() -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    tmp = STATE_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, indent=2))
    tmp.replace(STATE_FILE)


def update(**kw) -> None:
    with _lock:
        state["run"].update(kw)
        save()


def step_status(name: str, status: str, detail: str = "") -> None:
    with _lock:
        for s in state["run"]["steps"]:
            if s["name"] == name:
                s["status"], s["detail"] = status, detail or s.get("detail", "")
        save()


def log(line: str) -> None:
    line = re.sub(r"\x1b\[[0-9;]*m", "", line.rstrip())
    if not line.strip():
        return
    with _lock:
        tail = state["run"].setdefault("log_tail", [])
        tail.append(line[:300])
        del tail[:-40]
    with open(STATE_DIR / f"{state['run']['id']}.log", "a") as f:
        f.write(line + "\n")


class Cancelled(Exception):
    pass


def run(cmd: list[str], on_line=None, env: dict | None = None) -> str:
    """Run a command, streaming its output to the log; raise on failure/cancel."""
    global _proc
    if _cancel.is_set():
        raise Cancelled()
    out = []
    _proc = subprocess.Popen(cmd, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                             env={**os.environ, **(env or {})}, start_new_session=True)
    for line in _proc.stdout:
        if "| INFO" in line or "onnxruntime" in line:
            continue
        out.append(line)
        log(line)
        if on_line:
            on_line(line)
    code = _proc.wait()
    _proc = None
    if _cancel.is_set():
        raise Cancelled()
    if code != 0:
        raise RuntimeError(f"{Path(cmd[0]).name} exited with {code}: {''.join(out[-3:]).strip()[:300]}")
    return "".join(out)


def last_json(text: str) -> dict:
    """The final top-level JSON object a raft.py command printed."""
    end = text.rfind("}")
    depth = 0
    for i in range(end, -1, -1):
        depth += text[i] == "}"
        depth -= text[i] == "{"
        if depth == 0:
            return json.loads(text[i:end + 1])
    raise ValueError("no JSON summary in output")


def raft(*args: str, on_line=None) -> str:
    run(["docker", "cp", str(ROOT / "scripts/lora/raft.py"), f"{CONTAINER}:/tmp/raft.py"])
    return run(["docker", "exec", "-w", "/app/backend", CONTAINER, "python", "-u", "/tmp/raft.py", *args],
               on_line=on_line)


# ----------------------------------------------------------------------------
def pipeline(opts: dict) -> None:
    rid = state["run"]["id"]
    cdir = f"{CONTAINER_RUNS}/{rid}"
    ldir = ROOT / "data/lora/runs" / rid
    adir = ROOT / "models/lora/runs" / rid
    judges = opts["judges"]
    try:
        # --- build ---------------------------------------------------------
        step_status("build", "running", "writing questions")
        update(progress=2)

        def on_build(line: str) -> None:
            m = re.search(r"questions: (\d+) from (\d+) passages", line)
            if m:
                step_status("build", "running", f"questions: {m.group(1)} written")
            m = re.search(r"^\s+(\d+)/(\d+) \{", line)
            if m:
                done, total = int(m.group(1)), int(m.group(2))
                step_status("build", "running", f"answers: {done}/{total}")
                update(progress=2 + int(48 * done / max(total, 1)))

        out = raft("build", "--out", cdir, "--teacher", opts["teacher"], "--per-source", str(opts["per_source"]),
                   "--workers", "4" if opts["teacher"].startswith("claude") else "2",
                   "--sources", *opts["sources"], on_line=on_build)
        summary = last_json(out)
        ldir.mkdir(parents=True, exist_ok=True)
        for f in ("train", "valid", "test", "valid_prompts", "test_prompts"):
            run(["docker", "cp", f"{CONTAINER}:{cdir}/{f}.jsonl", str(ldir / f"{f}.jsonl")])
        if summary.get("train", 0) < 30 or summary.get("valid", 0) < 5 or summary.get("test", 0) < 5:
            raise RuntimeError(f"too few examples to tune and test: {summary}")
        step_status("build", "done", f"{summary['kept']} examples: {summary['train']} train / "
                                     f"{summary['valid']} valid / {summary['test']} test")

        # --- train -----------------------------------------------------------
        # ~2 epochs at batch 4, checkpoints at the halfway point and the end
        half = max(20, min(200, round(summary["train"] / 4 / 10) * 10))
        iters = 2 * half
        cfg = (ROOT / "scripts/lora/raft_config.yaml").read_text()
        for key, val in (("data", f'"{ldir.relative_to(ROOT)}"'), ("adapter_path", f'"{(adir / "adapters").relative_to(ROOT)}"'),
                         ("iters", str(iters)), ("save_every", str(half))):
            cfg = re.sub(rf"^{key}:.*$", f"{key}: {val}", cfg, flags=re.M)
        adir.mkdir(parents=True, exist_ok=True)
        (adir / "config.yaml").write_text(cfg)
        step_status("train", "running", f"0/{iters} steps")
        update(progress=50)

        def on_train(line: str) -> None:
            m = re.match(r"^\s+(\d+)\s+(val\s+)?([\d.]+)", re.sub(r"\x1b\[[0-9;]*m", "", line))
            if m:
                it = int(m.group(1))
                step_status("train", "running", f"{it}/{iters} steps" + (f", val loss {m.group(3)}" if m.group(2) else ""))
                update(progress=50 + int(20 * it / iters))

        run([str(VENV / "mlx_lm.lora"), "-c", str(adir / "config.yaml")], on_line=on_train)
        step_status("train", "done", f"{iters} steps")

        # --- export ----------------------------------------------------------
        cands = []
        for ck in (half, iters):
            name = f"euclid-tutor:{rid}-ck{ck}"
            step_status("export", "running", name)
            run([str(ROOT / "scripts/lora/export_ollama.sh"), name],
                env={"ADAPTERS": str(adir / "adapters"), "BASE_OLLAMA": BASE_OLLAMA,
                     "ADAPTER_FILE": str(adir / "adapters" / f"{ck:07d}_adapters.safetensors")})
            cands.append(name)
        step_status("export", "done", ", ".join(cands))
        update(progress=75)

        # --- pick on valid -----------------------------------------------------
        scores = {}
        for k, name in enumerate(cands):
            step_status("pick", "running", f"judging {name} on validation prompts")
            res = last_json(raft("eval", "--data", cdir, "--tuned", name, "--split", "valid",
                                 "--n", str(opts["eval_n"]), "--judges", *judges))
            scores[name] = sum(t["tuned"] - t["base"] for t in res["judges"].values())
            update(progress=75 + 8 * (k + 1), valid={**state["run"].get("valid", {}), name: res})
        best = max(cands, key=lambda c: scores[c])
        step_status("pick", "done", f"{best} (net wins {scores[best]:+d})")

        # --- gate on test ------------------------------------------------------
        step_status("gate", "running", f"judging {best} on held-out test prompts")
        res = last_json(raft("eval", "--data", cdir, "--tuned", best, "--split", "test",
                             "--n", str(opts["eval_n"]), "--judges", *judges))
        step_status("gate", "done", res["verdict"])
        update(progress=97, test=res)

        # --- finish ------------------------------------------------------------
        final = f"euclid-tutor:{rid}"
        run(["ollama", "cp", best, final])
        for c in cands:
            run(["ollama", "rm", c])
        step_status("finish", "done", final)
        update(status="done", progress=100, finished_at=time.time(),
               result={"model": final, "verdict": res["verdict"], "checkpoint": best, "test": res})
    except Cancelled:
        update(status="cancelled", finished_at=time.time())
    except Exception as exc:  # noqa: BLE001 - surface every failure in the UI
        log(f"ERROR: {exc}")
        with _lock:
            for s in state["run"]["steps"]:
                if s["status"] == "running":
                    s["status"] = "error"
        update(status="error", error=str(exc)[:500], finished_at=time.time())
    finally:
        with _lock:
            state["history"] = ([{k: state["run"].get(k) for k in ("id", "status", "result", "options", "started_at")}]
                                + state["history"])[:10]
            save()


def start(opts: dict) -> dict:
    with _lock:
        if state["run"] and state["run"].get("status") == "running":
            raise RuntimeError("a tuning run is already in progress")
        _cancel.clear()
        rid = datetime.now().strftime("raft-%Y%m%d-%H%M")
        state["run"] = {"id": rid, "status": "running", "progress": 0, "options": opts, "started_at": time.time(),
                        "steps": [{"name": s, "status": "pending", "detail": ""} for s in STEPS], "log_tail": []}
        save()
    threading.Thread(target=pipeline, args=(opts,), daemon=True).start()
    return state["run"]


def cancel() -> None:
    _cancel.set()
    if _proc is not None:
        try:
            os.killpg(_proc.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass


# ----------------------------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    def _send(self, code: int, body: dict) -> None:
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/status":
            with _lock:
                self._send(200, {"online": True, **state})
        else:
            self._send(404, {"detail": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
        try:
            if self.path == "/start":
                opts = {"sources": [str(s) for s in body["sources"]], "per_source": int(body.get("per_source", 30)),
                        "teacher": str(body.get("teacher", "qwen3:8b")),
                        "judges": [str(j) for j in body.get("judges", ["qwen3:8b", "llama3.1:8b"])][:2],
                        "eval_n": int(body.get("eval_n", 40))}
                if not opts["sources"]:
                    raise ValueError("choose at least one book")
                self._send(200, start(opts))
            elif self.path == "/cancel":
                cancel()
                self._send(200, {"cancelling": True})
            else:
                self._send(404, {"detail": "not found"})
        except (RuntimeError, ValueError, KeyError) as exc:
            self._send(409, {"detail": str(exc)})

    def log_message(self, *args) -> None:  # quiet
        pass


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--port", type=int, default=8765)
    args = ap.parse_args()
    global state
    if STATE_FILE.exists():
        state = json.loads(STATE_FILE.read_text())
        run_ = state.get("run")
        if run_ and run_.get("status") == "running":  # the helper restarted mid-run
            run_["status"], run_["error"] = "error", "interrupted: the tuning helper was restarted"
            save()
    print(f"Tuning helper on http://127.0.0.1:{args.port} (container {CONTAINER})", flush=True)
    ThreadingHTTPServer(("127.0.0.1", args.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
