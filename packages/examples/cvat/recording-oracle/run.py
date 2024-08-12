import uvicorn

from src.chain.kvstore import register_in_kvstore
from src.core.config import Config

if __name__ == "__main__":
    is_dev = Config.environment == "development"

    Config.validate()
    register_in_kvstore()

    uvicorn.run(
        app="src:app",
        host="0.0.0.0",
        port=int(Config.port),
        workers=Config.workers_amount,
        reload=is_dev,
    )
