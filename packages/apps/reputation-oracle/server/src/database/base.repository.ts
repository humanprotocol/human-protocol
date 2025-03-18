import {
  DataSource,
  EntityTarget,
  ObjectLiteral,
  QueryFailedError,
  Repository,
} from 'typeorm';
import {
  DatabaseError,
  handleQueryFailedError,
} from '../common/errors/database';
import { BaseEntity } from './base.entity';

export class BaseRepository<
  T extends BaseEntity & ObjectLiteral,
> extends Repository<T> {
  constructor(target: EntityTarget<T>, dataSource: DataSource) {
    super(target, dataSource.createEntityManager());
  }

  async createUnique(item: T): Promise<T> {
    try {
      const date = new Date();
      item.createdAt = date;
      item.updatedAt = date;

      await this.insert(item);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      } else {
        throw error;
      }
    }
    return item;
  }

  async updateOne(item: T): Promise<T> {
    try {
      item.updatedAt = new Date();
      await this.save(item);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      } else {
        throw error;
      }
    }
    return item;
  }

  async updateOneById(
    id: T['id'],
    partialEntity: Partial<T>,
  ): Promise<boolean> {
    try {
      const result = await this.update(id, {
        ...partialEntity,
        updatedAt: new Date(),
      });

      if (result.affected === undefined) {
        throw new DatabaseError(
          'Driver "update" operation does not provide expected result',
        );
      }

      return result.affected > 0;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      } else {
        throw error;
      }
    }
  }

  async deleteOne(item: T): Promise<void> {
    try {
      await this.remove(item);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      } else {
        throw error;
      }
    }
  }
}
