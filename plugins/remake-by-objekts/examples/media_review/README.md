# Synthetic source-video evidence fixture — v0.14

`synthetic_cut.mp4` is an originally generated four-second silent video: 2 seconds red static frame → 2 seconds blue static frame. No real clients, products, faces, commercial artwork or rights claims.

Run:

```bash
python -m media_review.cli examples/media_review/synthetic_cut.mp4 --target 3 --output-dir /tmp/cc-review
```

Expected source-grounded results: duration about 4s, candidate cut around 00:02, near-still image segments, and 1s above the *creator-supplied hypothetical* target. The scene detector is heuristic. The experiment has not been screened to human viewers and demonstrates no film direction superiority. It is a technical fixture only.

Local interface:

```bash
python -m pip install fastapi uvicorn python-multipart pillow
uvicorn media_review.app:app --host 127.0.0.1 --port 8891
```

Open `http://127.0.0.1:8891` and choose a file. The original upload is deleted after each request; the report is returned to your browser only. `ffmpeg` and `ffprobe` must be installed on your own computer; safety ceilings are 60MiB, 90sec, 4K. Do not publicly expose this local demo.
