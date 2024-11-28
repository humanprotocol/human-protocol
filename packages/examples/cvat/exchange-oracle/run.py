import uvicorn

from src.chain.kvstore import register_in_kvstore
from src.core.config import Config

if __name__ == "__main__":
    is_dev = Config.is_development_mode()
    Config.validate()
    register_in_kvstore()

    uvicorn.run(
        app="src:app",
        host="0.0.0.0",  # noqa: S104
        port=int(Config.port),
        workers=Config.workers_amount,
        # reload=is_dev,
    )
