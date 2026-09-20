import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';

describe('AppController', () => {
  let appController: AppController;
  const prisma = { isHealthy: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.isHealthy.mockResolvedValue(true);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('servis bilgisini döner', () => {
      expect(appController.getInfo()).toEqual({
        name: 'FieldLead API',
        version: '0.1.0',
        status: 'ok',
      });
    });
  });

  describe('health', () => {
    it('veritabanı ayaktayken ok döner', async () => {
      await expect(appController.getHealth()).resolves.toEqual({
        status: 'ok',
        database: 'up',
      });
    });

    it('veritabanı kapalıyken degraded döner', async () => {
      prisma.isHealthy.mockResolvedValue(false);

      await expect(appController.getHealth()).resolves.toEqual({
        status: 'degraded',
        database: 'down',
      });
    });
  });
});
