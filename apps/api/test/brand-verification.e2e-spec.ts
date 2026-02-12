
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { EmailService } from './../src/email/email.service';

describe('Brand Verification (e2e)', () => {
    let app: INestApplication;
    let authToken: string;
    const testEmail = `brandtest.${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    beforeAll(async () => {
        // Mock EmailService to prevent actual email sending
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(EmailService)
            .useValue({
                send: jest.fn().mockResolvedValue(true),
                sendOtp: jest.fn().mockResolvedValue(true),
                sendWelcome: jest.fn().mockResolvedValue(true),
                // Add other likely called methods
                sendBrandApplicationNotification: jest.fn().mockResolvedValue(true),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // 1. Register User
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: testEmail,
                password: testPassword,
                firstName: 'Brand',
                lastName: 'Tester',
            })
            .expect(201);

        // 2. Login
        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: testEmail,
                password: testPassword,
            })
            .expect(201);

        authToken = loginRes.body.accessToken;
    });

    afterAll(async () => {
        await app.close();
    });

    it('Apply for Brand Verification with Proof', async () => {
        const proofUrls = [
            'https://res.cloudinary.com/demo/image/upload/v1/proof1.jpg',
            'https://res.cloudinary.com/demo/image/upload/v1/proof2.png'
        ];

        // 3. Apply
        await request(app.getHttpServer())
            .post('/brand-verification/apply')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                brandName: 'Test Brand Inc.',
                brandWebsite: 'https://testbrand.com',
                brandInstagram: '@testbrand',
                brandPhysicalAddress: '123 Test St, Lagos',
                brandPhoneNumber: '+2348000000000',
                brandWhatsApp: '+2348000000000',
                brandApplicationNote: 'We are the official Test Brand.',
                brandProofUrls: proofUrls, // <--- Key verify: Persistence of this array
            })
            .expect(201);

        // 4. Check Status
        const statusRes = await request(app.getHttpServer())
            .get('/brand-verification/status')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        const statusData = statusRes.body;

        // VALIDATION
        if (statusData.brandVerificationStatus !== 'PENDING') {
            throw new Error(`Expected PENDING status, got ${statusData.brandVerificationStatus}`);
        }
        if (statusData.brandName !== 'Test Brand Inc.') {
            throw new Error(`Expected brandName to match, got ${statusData.brandName}`);
        }

        // Check Proof URLs
        if (!Array.isArray(statusData.brandProofUrls)) {
            throw new Error('brandProofUrls is not an array');
        }
        if (statusData.brandProofUrls.length !== 2) {
            throw new Error(`Expected 2 proof URLs, got ${statusData.brandProofUrls.length}`);
        }
        if (statusData.brandProofUrls[0] !== proofUrls[0]) {
            throw new Error('First proof URL does not match');
        }

        console.log('✅ Brand Application Verification Passed: Proof URLs persisted correctly.');
    });
});
