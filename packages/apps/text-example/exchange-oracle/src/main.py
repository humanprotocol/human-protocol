from fastapi import FastAPI

exchange_oracle = FastAPI(title="Text Example Exchange Oracle", version="0.1.0")


@exchange_oracle.get("/")
async def root():
    return {"message": "Hello World"}
