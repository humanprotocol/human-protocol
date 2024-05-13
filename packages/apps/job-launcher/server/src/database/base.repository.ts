import {
  DataSource,
  EntityTarget,
  ObjectLiteral,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { handleQueryFailedError } from '../common/errors/database';

export class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
  constructor(target: EntityTarget<T>, dataSource: DataSource) {
    super(target, dataSource.createEntityManager());
  }

  async createUnique(item: T): Promise<T> {
    try {
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
}
