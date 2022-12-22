import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { AuthDto } from '../src/auth/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    await app.listen(3000);
    prisma = moduleRef.get(PrismaService);
    await prisma.cleanDB();
    pactum.request.setBaseUrl('http://localhost:3000/');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'hello@wew.com',
      password: '12345678',
    };
    describe('Signup', () => {
      it('should throw if body empty', async () => {
        return pactum.spec().post('auth/signup/').expectStatus(400);
      });
      it('should throw if email empty', async () => {
        return pactum
          .spec()
          .post('auth/signup/')
          .withBody({ password: dto.password })
          .expectStatus(400);
      });
      it('should throw if password empty', async () => {
        return pactum
          .spec()
          .post('auth/signup/')
          .withBody({ email: dto.email })
          .expectStatus(400);
      });
      it('should create a new user', async () => {
        return pactum
          .spec()
          .post('auth/signup/')
          .withBody(dto)
          .expectStatus(201);
      });
    });
    describe('Signin', () => {
      it('should throw if body empty', async () => {
        return pactum.spec().post('auth/signin/').expectStatus(400);
      });
      it('should throw if email empty', async () => {
        return pactum
          .spec()
          .post('auth/signin/')
          .withBody({ password: dto.password })
          .expectStatus(400);
      });
      it('should throw if password empty', async () => {
        return pactum
          .spec()
          .post('auth/signin/')
          .withBody({ email: dto.email })
          .expectStatus(400);
      });
      it('should signin a user', async () => {
        return pactum
          .spec()
          .post('auth/signin/')
          .withBody(dto)
          .expectStatus(200)
          .stores('token', 'access_token');
      });
    });
  });
  describe('User', () => {
    describe('Get me', () => {
      it('should throw if not authenticated', async () => {
        return pactum.spec().get('users/me/').expectStatus(401);
      });
      it('should get the user', async () => {
        return pactum
          .spec()
          .get('users/me/')
          .withHeaders({ Authorization: 'Bearer $S{token}' })
          .expectStatus(200);
      });
    });

    describe('Edit User', () => {
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
      };
      it('should throw if not authenticated', async () => {
        return pactum.spec().patch('users/edit/').expectStatus(401);
      });
      it('should edit user', async () => {
        return pactum
          .spec()
          .patch('users/edit/')
          .withBody(dto)
          .withHeaders({ Authorization: 'Bearer $S{token}' })
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.lastName);
      });
    });
  });
  describe('Bookmark', () => {
    describe('Get empty bookmark', () => {
      it('should get an empty list', async () => {
        return pactum
          .spec()
          .get('bookmarks/')
          .withHeaders({ Authorization: 'Bearer $S{token}' })
          .expectStatus(200)
          .expectBody([]);
      });
    });
    describe('Create Bookmark', () => {
      const dto = {
        title: 'Freecodecamp NestJs Tutorial',
        link: 'https://www.youtube.com/watch?v=Q7AOvWpIVHU',
      };
      it('should create a bookmark', async () => {
        return pactum
          .spec()
          .post('bookmarks/')
          .withBody(dto)
          .withHeaders({ Authorization: 'Bearer $S{token}' })
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
    });
    describe('Get Bookmarks', () => {
      it('should get a list of bookmarks', async () => {
        return pactum
          .spec()
          .get('bookmarks/')
          .withHeaders({ Authorization: 'Bearer $S{token}' })
          .expectStatus(200)
          .expectBodyContains('Freecodecamp NestJs Tutorial');
      });
    });
    describe('Get Bookmark', () => {
      it('should get a bookmark', async () => {
        return pactum
          .spec()
          .get('bookmarks/{id}/')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{token}' })
          .expectStatus(200)
          .expectBodyContains('Freecodecamp NestJs Tutorial');
      });
    });
    describe('Edit Bookmark', () => {
      const dto = {
        description: 'A new description',
      };
      it('should update the bookmark', () => {
        return pactum
          .spec()
          .patch('bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{token}' })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.description);
      });
    });
    describe('Delete Bookmark', () => {
      it('should delete the bookmark', () => {
        return pactum
          .spec()
          .delete('bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{token}' })
          .expectStatus(204);
      });
      it('should get an empty bookmark list', async () => {
        return pactum
          .spec()
          .get('bookmarks/')
          .withHeaders({ Authorization: 'Bearer $S{token}' })
          .expectStatus(200)
          .expectBody([]);
      });
    });
  });
});
