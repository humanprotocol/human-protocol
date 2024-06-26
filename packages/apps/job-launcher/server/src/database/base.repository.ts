import {
  DataSource,
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { handleQueryFailedError } from '../common/errors/database';

export class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
  private readonly entityManager: EntityManager;
  constructor(target: EntityTarget<T>, dataSource: DataSource) {
    const entityManager = dataSource.createEntityManager();
    super(target, entityManager);
    this.entityManager = entityManager;
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

  async updateMany(items: T[]): Promise<void> {
    const queryRunner = this.entityManager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of items) {
        await queryRunner.manager.update(this.target, { id: item.id }, item);
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }
}
