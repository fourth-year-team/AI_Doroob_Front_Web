#!/usr/bin/env python3
"""
Generate sample inspection videos (MP4) for the AegisVerify demo.

Creates simple synthetic scenes: a colored vehicle silhouette on a road,
so real frame extraction + real pixel color analysis work out of the box.
Videos are intentionally simple placeholders — replace them with real
company inspection recordings under public/videos/ when available.
"""

import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import imageio_ffmpeg

W, H, FPS, DUR = 640, 360, 30, 6
OUT = Path(__file__).resolve().parent.parent / "public" / "videos"
OUT.mkdir(parents=True, exist_ok=True)

SKY_TOP = np.array([200, 202, 206], dtype=np.float32)
SKY_BOTTOM = np.array([172, 175, 181], dtype=np.float32)
ROAD = np.array([128, 132, 138], dtype=np.float32)
ROAD_LINE = np.array([206, 210, 216], dtype=np.float32)
CAR_BODY = {
    "white": np.array([238, 238, 240], dtype=np.float32),
    "black": np.array([28, 30, 34], dtype=np.float32),
    "red": np.array([196, 34, 34], dtype=np.float32),
    "blue": np.array([32, 74, 186], dtype=np.float32),
    "green": np.array([38, 138, 68], dtype=np.float32),
    "silver": np.array([186, 192, 200], dtype=np.float32),
}
CABIN_SHADE = {
    "white": np.array([212, 212, 216], dtype=np.float32),
    "black": np.array([44, 47, 52], dtype=np.float32),
    "red": np.array([164, 28, 28], dtype=np.float32),
    "blue": np.array([27, 62, 156], dtype=np.float32),
    "green": np.array([32, 116, 57], dtype=np.float32),
    "silver": np.array([158, 164, 172], dtype=np.float32),
}

rng = np.random.default_rng(7)

# Precomputed coordinate grids
yy, xx = np.mgrid[0:H, 0:W]


def rounded_rect_mask(x0, y0, x1, y1, r):
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2
    hw = (x1 - x0) / 2 - r
    hh = (y1 - y0) / 2 - r
    dx = np.abs(xx - cx) - hw
    dy = np.abs(yy - cy) - hh
    ox = np.maximum(dx, 0)
    oy = np.maximum(dy, 0)
    dist = np.sqrt(ox**2 + oy**2)
    return (dist <= r) & (xx >= x0) & (xx <= x1) & (yy >= y0) & (yy <= y1)


def ellipse_mask(cx, cy, rx, ry):
    return ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1


def render_frame(t, color_key):
    fy = np.linspace(0, 1, H, dtype=np.float32)
    frame = np.empty((H, W, 3), dtype=np.float32)
    frame[:] = SKY_TOP[None, None, :] + fy[:, None, None] * (SKY_BOTTOM - SKY_TOP)[None, None, :]
    road_y0 = int(H * 0.58)
    frame[road_y0:] = ROAD

    for ly in range(road_y0 + 150, H, 26):
        frame[ly : ly + 6, 120:240] = ROAD_LINE
        frame[ly : ly + 6, 400:520] = ROAD_LINE

    sway = int(9 * np.sin(2 * np.pi * t / (DUR * 0.8)))
    car_cx = W // 2 + sway
    x0, x1 = car_cx - 270, car_cx + 270
    y0, y1 = 100, 284

    frame[ellipse_mask(car_cx, y1 + 10, 235, 26)] = np.array([96, 100, 106], dtype=np.float32)
    for wx in (x0 + 52, x1 - 52):
        frame[ellipse_mask(wx, y1 - 8, 34, 36)] = np.array([18, 18, 22], dtype=np.float32)
        frame[ellipse_mask(wx, y1 - 8, 14, 15)] = np.array([120, 124, 130], dtype=np.float32)

    frame[rounded_rect_mask(x0, y0, x1, y1, 34)] = CAR_BODY[color_key]
    frame[rounded_rect_mask(x0 + 46, y0 + 12, x1 - 46, y0 + 92, 30)] = CABIN_SHADE[color_key]

    plate = rounded_rect_mask(x0 + 22, y1 - 44, x0 + 86, y1 - 16, 6)
    frame[plate] = np.array([235, 236, 238], dtype=np.float32)
    frame[plate & (xx % 9 < 5) & (yy % 9 > 4)] = np.array([40, 42, 48], dtype=np.float32)

    frame[ellipse_mask(x1 - 20, y0 + 66, 12, 10)] = np.array([228, 214, 148], dtype=np.float32)

    frame += rng.normal(0, 2.2, (H, W, 1))
    return np.clip(frame, 0, 255).astype(np.uint8)


def write_video(path: Path, color_key: str):
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [
        ffmpeg,
        "-y",
        "-f", "rawvideo",
        "-pix_fmt", "rgb24",
        "-s", f"{W}x{H}",
        "-r", str(FPS),
        "-i", "-",
        "-an",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "23",
        "-movflags", "+faststart",
        str(path),
    ]
    proc = subprocess.Popen(
        cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    total = FPS * DUR
    t0 = time.time()
    for f in range(total):
        frame = render_frame(f / FPS, color_key)
        proc.stdin.write(frame.tobytes())
    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg failed for {path.name} (code {proc.returncode})")
    print(
        f"  wrote {path.name} ({path.stat().st_size / 1024:.0f} KB, {time.time() - t0:.1f}s)",
        flush=True,
    )


def main():
    videos = [
        ("vid001.mp4", "white"),
        ("vid002.mp4", "black"),
        ("vid003.mp4", "red"),
        ("vid004.mp4", "white"),
        ("vid005.mp4", "white"),
        ("vid006.mp4", "white"),
    ]
    for name, color in videos:
        write_video(OUT / name, color)
    print("Done. Replace with real company recordings when available.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # pragma: no cover
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
