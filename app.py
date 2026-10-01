import os

from flask import Flask

app = Flask(__name__)


@app.get("/")
def home():
    return """
    <!doctype html>
    <html lang="vi">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Hello World</title>
      <style>
        body {
          margin: 0;
          min-height: 100vh;
          display: grid;
          place-items: center;
          font-family: Segoe UI, sans-serif;
          background: linear-gradient(135deg, #0b5cab, #148f77);
          color: white;
        }
        h1 { font-size: 3rem; margin: 0; }
        p { opacity: 0.9; }
      </style>
    </head>
    <body>
      <div>
        <h1>Hello World</h1>
        <p>Ứng dụng Quan lý THPT đã chạy trên Azure.</p>
      </div>
    </body>
    </html>
    """


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
