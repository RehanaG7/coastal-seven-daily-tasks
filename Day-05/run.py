import sys
import selectors
import asyncio
import uvicorn
from app.main import app

if __name__ == "__main__":
    if sys.platform == "win32":
        loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
        asyncio.set_event_loop(loop)

    config = uvicorn.Config(
        app=app,
        host="127.0.0.1",
        port=8080,
        loop="none",  # Tells Uvicorn to use our existing SelectorEventLoop
    )
    server = uvicorn.Server(config)
    server.run()