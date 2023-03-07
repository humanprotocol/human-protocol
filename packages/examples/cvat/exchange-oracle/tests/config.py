class TestDB:
    port = 5432
    host = "0.0.0.0"
    user = "test"
    password = "test"
    database = "exchange_oracle_test"

    @classmethod
    def connection_url(cls):
        return f"postgresql://{TestDB.user}:{TestDB.password}@{TestDB.host}:{TestDB.port}/{TestDB.database}"
