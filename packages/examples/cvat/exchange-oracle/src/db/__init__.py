from contextlib import contextmanager
from typing import TYPE_CHECKING, Any, ClassVar, Generic, TypeVar
from uuid import uuid4

import sqlalchemy
from psycopg2.errors import Error
from sqlalchemy import DDL, UUID, event, func
from sqlalchemy.exc import SQLAlchemyError, StatementError
from sqlalchemy.orm import (
    DeclarativeBase,
    InstrumentedAttribute,
    Mapped,
    Relationship,
    mapped_column,
    sessionmaker,
)

import src.utils.logging
from src.core.config import Config

DATABASE_URL = Config.postgres_config.connection_url()
engine = sqlalchemy.create_engine(
    DATABASE_URL,
    echo="debug" if Config.loglevel <= src.utils.logging.TRACE else False,
    connect_args={"options": f"-c lock_timeout={Config.postgres_config.lock_timeout:d}"},
)
SessionLocal = sessionmaker(autocommit=False, bind=engine)


class Base(DeclarativeBase):
    __abstract__ = True
    __tablename__: ClassVar[str]


class BaseUUID(Base):
    __abstract__ = True
    id: Mapped[str] = mapped_column(
        # Using `str` instead of python `uuid.UUID` for now
        # to reduce amount of code needed to be rewritten.
        # At some point it would make sense to use UUID(as_uuid=True).
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
        server_default=func.uuid_generate_v4(),
        sort_order=-1,  # Make sure it's the first column.
        index=True,
    )


ParentT = TypeVar("ParentT", bound=type[Base])


class ChildOf(BaseUUID, Generic[ParentT]):
    __abstract__ = True

    if TYPE_CHECKING:
        parent: InstrumentedAttribute[ParentT]  # This will act as an alias
        parent_cls: ParentT

    def __init_subclass__(cls, **kwargs: Any) -> None:
        super().__init_subclass__(**kwargs)
        cls.parent, cls.parent_cls = cls._find_existing_parent_attribute()

    @classmethod
    def _find_existing_parent_attribute(cls) -> InstrumentedAttribute[ParentT]:
        # Extract ParentT from the Generic bases
        for base in cls.__orig_bases__:
            if getattr(base, "__origin__", None) is ChildOf:
                parent_type = base.__args__[0]
                break
        else:
            raise TypeError(
                f"class {cls.__name__}({ChildOf.__name__}) must specify its parent as"
                f"class {cls.__name__}({ChildOf.__name__}[ParentClass])"
            )

        for attr_name in dir(cls):
            attr_value = getattr(cls, attr_name, None)
            match getattr(cls, attr_name, None):
                case InstrumentedAttribute(prop=Relationship(argument=parent_type.__name__)):
                    return attr_value, parent_type
                case InstrumentedAttribute(prop=Relationship(argument=t)) if t is parent_type:
                    return attr_value, parent_type
        raise AttributeError(
            f"Could not find relationship with parent type"
            f" {parent_type.__name__} on {cls.__name__}"
        )


create_uuid_extension = DDL('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
event.listen(Base.metadata, "before_create", create_uuid_extension)


@contextmanager
def suppress(*exceptions: type[SQLAlchemyError] | type[Error]):
    """
    Works similarly to `contextlib.suppress`, but also checks for `e.orig`.
    """
    try:
        yield
    except exceptions:
        pass
    except StatementError as e:
        if not isinstance(e.orig, exceptions):
            raise
