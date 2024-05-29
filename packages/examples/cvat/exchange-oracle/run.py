import uvicorn

from src.core.config import Config

if __name__ == "__main__":
    is_dev = Config.environment == "development"
    uvicorn.run(
        app="src:app",
        host="0.0.0.0",
        port=int(Config.port),
        workers=Config.workers_amount,
        # reload=is_dev,
    )
