/**
 * @jest-environment node
 */
import { DELETE } from '@/app/api/super-admin/companies/[id]/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Helper to mock Request
function createRequest(method: string) {
    return {
        method,
    } as unknown as Request;
}

describe('Audit Logging', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getServerSession as jest.Mock).mockResolvedValue({
            user: {
                id: 'super-admin-id',
                role: 'SUPER_ADMIN',
                companyId: 'platform'
            }
        });
    });

    it('should create audit log when deleting a company', async () => {
        // Mock company deletion
        (prisma.company.delete as jest.Mock).mockResolvedValue({
            id: 'company-123',
            name: 'Test Company'
        });

        const req = createRequest('DELETE');
        await DELETE(req, { params: { id: 'company-123' } });

        // Verify audit log creation
        expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                action: 'DELETE_COMPANY',
                entityType: 'Company',
                entityId: 'company-123',
                userId: 'super-admin-id',
                metadata: expect.stringContaining('Test Company') // Metadata is stringified JSON? 
                // Wait, createAuditLog stringifies metadata? 
                // Let's check lib/audit.ts or assume it passes object to prisma if schema allows Json
            })
        }));
    });
});
