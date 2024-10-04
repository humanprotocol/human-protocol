from datetime import datetime
from typing import TYPE_CHECKING, Any, ClassVar, Generic, TypeVar

import sqlalchemy
from sqlalchemy import update
from sqlalchemy.orm import (
    DeclarativeBase,
    InstrumentedAttribute,
    Relationship,
    Session,
    sessionmaker,
)

import src.utils.logging
from src.core.config import Config
from src.utils.time import utcnow

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

    def touch(
        self, session: Session, *, touch_parent: bool = True, time: datetime | None = None
    ) -> None:
        cls = self.__class__
        if time is None:
            time = utcnow()
        session.execute(update(cls).where(cls.id == self.id).values({cls.updated_at: time}))
        if touch_parent and isinstance(self, ChildOf):
            self.parent.touch(session, touch_parent=True, time=time)


ParentT = TypeVar("ParentT", bound=type[Base])


class InstrumentedAttributeProxy:
    def __init__(self, instrumented_attribute: InstrumentedAttribute) -> None:
        self._instrumented_attribute = instrumented_attribute

    def __get__(self, instance: Any, owner: Any) -> Any:
        return self._instrumented_attribute.__get__(instance, owner)

    def __set__(self, instance: Any, value: Any) -> None:
        self._instrumented_attribute.__set__(instance, value)

    def __delete__(self, instance: Any) -> None:
        self._instrumented_attribute.__delete__(instance)


class ChildOf(Base, Generic[ParentT]):
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
